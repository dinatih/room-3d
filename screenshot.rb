#!/usr/bin/env ruby
# Usage:
#   ruby screenshot.rb                          # screenshot de l'état actuel
#   ruby screenshot.rb screenshots/mon_nom.png  # chemin personnalisé
#   ruby screenshot.rb --all-commits            # un screenshot par commit

require 'selenium-webdriver'
require 'fileutils'

WAIT_SEC   = 5      # secondes d'attente pour le rendu WebGL + GLBs

# 4 vues autour de la pièce (coordonnées cm, centre ≈ 150, 30, 200)
# Chaque entrée : [label, [px, py, pz], [tx, ty, tz]]
CAM_VIEWS = [
  ['NW', [-150, 900, -100], [150, 30, 200]],
  ['NE', [ 450, 900, -100], [150, 30, 200]],
  ['SE', [ 450, 900,  500], [150, 30, 200]],
  ['SW', [-150, 900,  500], [150, 30, 200]],
].freeze
BASE_PORT  = 8080   # port pour le screenshot unique (serveur déjà lancé)
SHOTS_DIR  = File.join(__dir__, 'screenshots')
WIDTH      = 2256
HEIGHT     = 1504

# ── Driver Chrome (visible) ────────────────────────────────────────────────
def make_driver
  options = Selenium::WebDriver::Chrome::Options.new
  # Mode visible pour voir le rendu en direct
  # options.add_argument('--headless=new')  # décommenter pour headless
  options.add_argument("--window-size=#{WIDTH},#{HEIGHT}")
  options.add_argument('--kiosk')             # force le vrai plein écran, bypass le tiling Hyprland
  options.add_argument('--no-sandbox')
  options.add_argument('--disable-dev-shm-usage')

  Selenium::WebDriver.for(:chrome, options:)
end

# ── Prend un screenshot de la page ────────────────────────────────────────
def set_camera(driver, pos, target)
  driver.execute_script(<<~JS)
    const cam = window.__camera;
    const ctrl = window.__controls;
    if (!cam || !ctrl) return;
    // Adapter les coordonnées si le commit utilise des studs (scale=0.1) au lieu de cm (scale=1)
    const s = window.__coordScale ?? 1;
    // Étendre le clipping plane pour les vieux commits (far=500 < notre distance caméra ~900)
    cam.far = 5000;
    cam.updateProjectionMatrix();
    cam.position.set(#{pos[0]} * s, #{pos[1]} * s, #{pos[2]} * s);
    ctrl.target.set(#{target[0]} * s, #{target[1]} * s, #{target[2]} * s);
    ctrl.update();
    if (window.__requestRender) window.__requestRender();
  JS
  sleep(0.5) # laisser le temps au frame de se dessiner
end

def take_screenshots(driver, base_path, port = BASE_PORT)
  FileUtils.mkdir_p(File.dirname(base_path))
  driver.get("http://localhost:#{port}/lego-room.html")
  sleep(WAIT_SEC)

  # Un screenshot par vue cardinale
  CAM_VIEWS.each do |label, pos, target|
    set_camera(driver, pos, target)
    path = base_path.sub(/\.png$/, "_#{label}.png")
    driver.save_screenshot(path)
    puts "  ✓ #{File.basename(path)}"
  end
end

# ── Mode : screenshot unique (toutes les vues) ────────────────────────────
def single_shot(output_path)
  driver = make_driver
  take_screenshots(driver, output_path)
ensure
  driver&.quit
end

# ── Patch un worktree pour exposer camera/controls/requestRender sur window ─
# Nécessaire pour les commits qui n'ont pas encore ces exports.
# Deux cas : version modulaire (js/scene.js) ou monolithique (lego-room.html).
def patch_worktree(tmp)
  scene_js = "#{tmp}/js/scene.js"
  main_js  = "#{tmp}/js/main.js"
  html     = "#{tmp}/lego-room.html"

  if File.exist?(scene_js)
    # ── Version modulaire ──────────────────────────────────────────────────
    # Détecter l'échelle depuis config.js : ROOM_W=30 → studs (scale=0.1), ROOM_W=300 → cm (scale=1)
    config_js = "#{tmp}/js/config.js"
    coord_scale = 1.0
    if File.exist?(config_js)
      room_w = File.read(config_js).match(/ROOM_W\s*=\s*(\d+)/i)&.captures&.first.to_i
      coord_scale = (room_w > 0 && room_w <= 50) ? 0.1 : 1.0
    end

    # Patch scene.js : ajouter window.__camera/controls/renderer s'ils sont absents
    src = File.read(scene_js)
    unless src.include?('window.__camera')
      File.write(scene_js, src + "\n// [screenshot patch]\nwindow.__camera = camera;\nwindow.__controls = controls;\nwindow.__renderer = renderer;\nwindow.__coordScale = #{coord_scale};\n")
    end

    # Patch main.js : exposer requestRender s'il est importé mais pas encore sur window
    if File.exist?(main_js)
      msrc = File.read(main_js)
      if msrc.include?('requestRender') && !msrc.include?('window.__requestRender')
        # Insérer après le premier requestRender(); du code principal
        patched = msrc.sub(/^(requestRender\(\);)$/m, "\\1\nwindow.__requestRender = requestRender; // [screenshot patch]")
        File.write(main_js, patched)
      end
    end

  elsif File.exist?(html)
    # ── Version monolithique : injecter window.__camera juste après controls.update() ──
    src = File.read(html)
    unless src.include?('window.__camera')
      # Détecter l'échelle d'unités : ROOM_W=30 → studs (scale=0.1), ROOM_W=300 → cm (scale=1)
      room_w = src.match(/ROOM_W\s*=\s*(\d+)/i)&.captures&.first.to_i
      coord_scale = (room_w > 0 && room_w <= 50) ? 0.1 : 1.0

      patched = src.sub(
        /(controls\.update\(\);)/,
        "\\1\n    window.__camera = camera; window.__controls = controls; " \
        "window.__coordScale = #{coord_scale}; " \
        "window.__requestRender = () => { renderer.render(scene, camera); };"
      )
      File.write(html, patched)
    end
  end
end

# ── Mode : un screenshot par commit ───────────────────────────────────────
def all_commits_shots
  commits = `git -C #{__dir__} log --reverse --format="%H %ai %s"`.lines.map do |l|
    hash, date, time, tz, *msg = l.strip.split(' ')
    timestamp = "#{date}_#{time[0, 5].gsub(':', '-')}" # 2026-02-17_19-17
    [hash, timestamp, msg.join(' ')]
  end

  puts "#{commits.size} commits trouvés"
  driver = make_driver
  repo   = __dir__

  commits.each_with_index do |(hash, timestamp, msg), i|
    short = hash[0, 7]
    # Nom de fichier : timecode_index_hash_message-slug.png
    slug  = msg.downcase.gsub(/[^a-z0-9]+/, '-')[0, 40].chomp('-')
    filename = format('%s_%03d_%s_%s.png', timestamp, i + 1, short, slug)
    path  = File.join(SHOTS_DIR, filename)

    # Considérer comme déjà fait si toutes les vues existent
    if CAM_VIEWS.all? { |label, _| File.exist?(path.sub(/\.png$/, "_#{label}.png")) }
      puts "⏭  #{filename} (déjà existant)"
      next
    end

    puts "\n[#{i+1}/#{commits.size}] #{timestamp} #{short} — #{msg}"

    # Port unique par commit pour éviter les conflits avec le serveur principal (8080)
    # server.rb prend le port SSL en arg, HTTP = ssl-443+80
    # On veut HTTP sur port 9000+i, donc SSL = 9000+i+363
    port     = 9000 + (i % 100)
    ssl_port = port + 363

    # Checkout du commit dans un worktree temporaire
    tmp = "/tmp/room3d_#{short}"
    system("git -C #{repo} worktree add --detach #{tmp} #{hash} -q 2>/dev/null")

    # Patcher le worktree pour exposer camera/controls sur window
    patch_worktree(tmp)

    # Toujours copier server.rb + certificats SSL dans le worktree pour que __dir__ pointe vers tmp
    # (sans ça, le serveur sert les fichiers du repo courant, pas du worktree)
    FileUtils.cp("#{repo}/server.rb", "#{tmp}/server.rb") unless File.exist?("#{tmp}/server.rb")
    %w[cert.pem key.pem].each do |f|
      FileUtils.cp("#{repo}/#{f}", "#{tmp}/#{f}") if File.exist?("#{repo}/#{f}") && !File.exist?("#{tmp}/#{f}")
    end
    server_script = "#{tmp}/server.rb"

    begin
      server_pid = spawn("ruby #{server_script} #{ssl_port}",
                         chdir: tmp, out: '/dev/null', err: '/dev/null')
      sleep(3) # laisser le temps au serveur de démarrer
      take_screenshots(driver, path, port)
    rescue => e
      puts "  ⚠ erreur : #{e.message}"
    ensure
      Process.kill('TERM', server_pid) rescue nil
      sleep(0.5)
      system("git -C #{repo} worktree remove --force #{tmp} 2>/dev/null")
    end
  end

  puts "\nTerminé. Screenshots dans #{SHOTS_DIR}/"
ensure
  driver&.quit
end

# ── Main ───────────────────────────────────────────────────────────────────
case ARGV[0]
when '--all-commits'
  all_commits_shots
else
  output = ARGV[0] || File.join(SHOTS_DIR, "screenshot_#{Time.now.strftime('%Y%m%d_%H%M%S')}.png")
  single_shot(output)
end

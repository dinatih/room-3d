require 'rack'
require 'puma'
require 'puma/configuration'
require 'puma/launcher'

port = ARGV[0]&.to_i || 8443
http_port = port - 443 + 80 # 8443 → 8080, 9443 → 9080
dir = __dir__

no_cache = lambda do |env|
  status, headers, body = Rack::Files.new(dir).call(env)
  path = env['PATH_INFO']
  if path.end_with?('.js', '.html', '.mjs')
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '0'
  end
  [status, headers, body]
end

app = Rack::Builder.new do
  use Rack::Static, urls: ['/'], root: dir, index: 'lego-room.html'
  run no_cache
end.to_app

conf = Puma::Configuration.new do |c|
  c.bind "ssl://0.0.0.0:#{port}?cert=#{File.join(dir, 'cert.pem')}&key=#{File.join(dir, 'key.pem')}"
  c.bind "tcp://0.0.0.0:#{http_port}"
  c.app app
end

launcher = Puma::Launcher.new(conf)
launcher.run

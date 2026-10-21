"""Convert the supplied Mixamo Y Bot using the extra-character import pipeline."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import convert_and_render_extra_characters as converter

converter.BASE_FBX_DIR = '/home/dinatih/3D Resources'
converter.PUBLIC_CHAR_DIR = str(Path(__file__).resolve().parents[1] / 'public/characters')
# The application supplies its own interactive previews.
converter.render_preview = lambda *_: None
height = converter.process_character({'id': 'ybot', 'fbx': 'Y Bot.fbx'})
config = Path(__file__).resolve().parents[1] / 'src/features/scene/characterConfig.ts'
text = config.read_text()
entry = "  { id: 'ybot', name: 'Y Bot', emoji: '🤖', color: '#f1c40f', path: 'characters/ybot/ybot.glb', pos: [0, 0, 0], rot: 0, variant: 'native', height: " + str(round(height, 1)) + ", isLara: false },\n"
assert "id: 'ybot'" not in text
text = text.replace("  { id: 'curious_skeleton',", entry + "  { id: 'curious_skeleton',", 1)
text = text.replace("  'xbot', 'native', 'rosanna', 'marissa', 'delphina', 'sara',", "  'ybot', 'xbot', 'native', 'rosanna', 'marissa', 'delphina', 'sara',", 1)
config.write_text(text)

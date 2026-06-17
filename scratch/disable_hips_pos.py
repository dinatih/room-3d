import os

file_path = 'lara_xbot_debug.html'
with open(file_path, 'r') as f:
    content = f.read()

# Disable Hips position retargeting to see if she stands up
old_pos = """          // Retarget position for hips
          if (prop === 'position' && isHips) {"""
new_pos = """          // Retarget position for hips DISABLED
          if (false && prop === 'position' && isHips) {"""

content = content.replace(old_pos, new_pos)

with open(file_path, 'w') as f:
    f.write(content)
print("SUCCESS")

import os

file_path = 'lara_xbot_debug.html'
with open(file_path, 'r') as f:
    content = f.read()

# Fix loadModels to STAND UP Lara if she is lying down
old_block = """          c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
          if (c.isBone) {
            c.defaultPosition = c.position.clone();
            c.defaultRotation = c.rotation.clone();
            c.defaultScale = c.scale.clone();
            
            c.restLocalQuaternion = c.quaternion.clone();
          }"""

new_block = """          let wq = c.getWorldQuaternion(new THREE.Quaternion());
          
          // LARA STAND UP HACK: If she is lying down in rest pose, stand her up
          if (key === 'lara') {
              const standUp = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
              wq.premultiply(standUp);
          }
          
          c.restWorldQuaternion = wq;
          if (c.isBone) {
            c.defaultPosition = c.position.clone();
            c.defaultRotation = c.rotation.clone();
            c.defaultScale = c.scale.clone();
            c.restLocalQuaternion = c.quaternion.clone();
          }"""

content = content.replace(old_block, new_block)

with open(file_path, 'w') as f:
    f.write(content)
print("SUCCESS")

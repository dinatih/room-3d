import json
from pathlib import Path
import numpy as np

source = Path('/home/dinatih/3D Resources/animations/Inter-X_Dataset-motions/motions')
manifest = json.loads(Path('public/animations/npz/interx/animations_manifest.json').read_text())
for duo in manifest['duos']:
    print(duo['id'])
    for person in ('p1', 'p2'):
        with np.load(source / duo['source'][person], allow_pickle=False) as data:
            print(person, {key: list(data[key].shape) for key in data.files})
            for key in ('trans', 'betas', 'gender'):
                if key in data:
                    print(key, data[key].reshape(-1)[:16])

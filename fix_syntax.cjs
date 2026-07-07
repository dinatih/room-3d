const fs = require('fs');
let code = fs.readFileSync('test_metarig.html', 'utf-8');
code = code.replace(
`      gui.add(guiOptions, 'showSkeleton').name('Afficher Squelette').onChange(v => {
        if (skeletonHelper) skeletonHelper.visible = v;
      });
              }
      });
      gui.add(guiOptions, 'paused').name('Pause').onChange(v => {
        if (mixer) mixer.timeScale = v ? 0 : guiOptions.timeScale;
      });`,
`      gui.add(guiOptions, 'showSkeleton').name('Afficher Squelette').onChange(v => {
        if (skeletonHelper) skeletonHelper.visible = v;
      });`
);
fs.writeFileSync('test_metarig.html', code);
console.log('Fixed');

const fs = require('fs');
let metarig = fs.readFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', 'utf8');

const oldLoaderCall = /loader\.load\(animDef\.url, \(animGltf\) => \{/;
const newLoaderCall = `loader.load(animDef.url, (animGltf) => {`;
// Wait, I need to add an error handler to loader.load.
// loader.load(url, onLoad, onProgress, onError)

const oldLoadCallFull = /loader\.load\(animDef\.url, \(animGltf\) => \{[\s\S]*?\}\);/;
const match = metarig.match(oldLoadCallFull);
if (match) {
    let replaced = match[0].replace(/}\);$/, `}, undefined, (err) => {
              console.error("Failed to load", animDef.url, err);
              loadedCount++;
              if (loadedCount === animsToLoad.length) {
                const animOptions = Object.keys(loadedClips).sort();
                animOptions.unshift('None');
                gui.add(guiOptions, 'animation', animOptions).name('Animation').onChange(v => {
                  playAnimation(v);
                });
                guiOptions.animation = 'None';
                playAnimation('None');
                animate();
              }
            });`);
    metarig = metarig.replace(match[0], replaced);
    fs.writeFileSync('/home/dinatih/Projects/room-3d/test_metarig.html', metarig);
    console.log("Patched loader with error handler!");
}

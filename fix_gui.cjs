const fs = require('fs');
let code = fs.readFileSync('test_metarig.html', 'utf-8');
const guiStart = code.indexOf("guiOptions.togglePause = () => {");
const guiEnd = code.indexOf("}", guiStart) + 1; // finds the end of togglePause? No.
code = code.replace(/guiOptions\.togglePause = \(\) => \{\n\s+if \(mixer[^\n]+\n\s+\}\);\n\s+\}/, 
\`      guiOptions.togglePause = () => {
        guiOptions.paused = !guiOptions.paused;
        const v = guiOptions.paused;
        if (mixer) mixer.timeScale = v ? 0 : guiOptions.timeScale;
        if (xbotMixer) xbotMixer.timeScale = v ? 0 : guiOptions.timeScale;
        if (rosannaMixer) rosannaMixer.timeScale = v ? 0 : guiOptions.timeScale;
      };
      gui.add(guiOptions, 'togglePause').name('Pause/Play');
      
      gui.add(guiOptions, 'timeScale', 0.1, 3.0, 0.1).name('Speed').onChange(v => {
        if (mixer && !guiOptions.paused) mixer.timeScale = v;
        if (xbotMixer && !guiOptions.paused) xbotMixer.timeScale = v;
        if (rosannaMixer && !guiOptions.paused) rosannaMixer.timeScale = v;
      });
      gui.add(guiOptions, 'frame', 0, 100, 1).name('Frame (%)').listen().onChange(v => {
        if (currentAction && currentAction.getClip()) {
           guiOptions.paused = true;
           if (mixer) mixer.timeScale = 0;
           if (xbotMixer) xbotMixer.timeScale = 0;
           if (rosannaMixer) rosannaMixer.timeScale = 0;
           const targetTime = (v / 100) * currentAction.getClip().duration;
           mixer.setTime(targetTime);
           if (xbotMixer) xbotMixer.setTime(targetTime);
           if (rosannaMixer) rosannaMixer.setTime(targetTime);
        }
      });
    }\`);
fs.writeFileSync('test_metarig.html', code);
console.log('Fixed GUI');

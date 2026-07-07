const fs = require('fs');
let html = fs.readFileSync('test_metarig.html', 'utf8');
const search = "rosannaModel.position.set(50, 0, 0);";
const replace = "rosannaModel.position.set(50, 0, 0);\n          rosannaModel.scale.set(100, 100, 100);";
if (html.includes(search)) {
    html = html.replace(search, replace);
    fs.writeFileSync('test_metarig.html', html);
    console.log("Patched Rosanna scale");
} else {
    console.log("Could not find string");
}

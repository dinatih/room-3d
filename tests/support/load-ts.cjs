const fs = require('node:fs');
const ts = require('typescript');
// Only pure TypeScript dependencies are loaded in Node. Browser integrations use Vite.
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: file,
}).outputText, file);
exports.load = (file, dependencies, transform = source => source) => {
    const module = { exports: {} };
    new Function('exports', 'module', 'require', ts.transpileModule(transform(fs.readFileSync(file, 'utf8')), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: file,
    }).outputText)(module.exports, module, name => {
        if (!(name in dependencies))
            throw Error(`Unexpected dependency ${name} in ${file}`);
        return dependencies[name];
    });
    return module.exports;
};

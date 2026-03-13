const fs = require("fs");
const path = require("path");
const Module = require("module");
const { transformSync } = require("@babel/core");

const clientRoot = path.resolve(__dirname, "../../client");
const originalJsLoader = Module._extensions[".js"];

function transpileClientModule(module, filename) {
  if (!filename.startsWith(clientRoot)) {
    return originalJsLoader(module, filename);
  }

  const source = fs.readFileSync(filename, "utf8");
  const { code } = transformSync(source, {
    babelrc: false,
    configFile: false,
    filename,
    presets: [
      [
        require.resolve("@babel/preset-env"),
        {
          modules: "commonjs",
          targets: { node: "current" },
        },
      ],
    ],
  });

  module._compile(code, filename);
}

function loadClientModule(relativePath) {
  const absolutePath = path.resolve(clientRoot, relativePath);

  Module._extensions[".js"] = transpileClientModule;

  try {
    delete require.cache[absolutePath];
    return require(absolutePath);
  } finally {
    Module._extensions[".js"] = originalJsLoader;
  }
}

module.exports = {
  loadClientModule,
};

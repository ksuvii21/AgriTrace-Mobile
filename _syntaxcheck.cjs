// Temporary syntax check for JSX files. Not part of the app.
const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");

const files = process.argv.slice(2);
let failed = 0;

for (const file of files) {
  try {
    const code = fs.readFileSync(file, "utf8");
    babel.transformSync(code, {
      filename: path.basename(file),
      presets: [
        ["@babel/preset-typescript", { allExtensions: true, isTSX: true }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
      babelrc: false,
      configFile: false,
    });
    console.log("OK  " + file);
  } catch (error) {
    failed += 1;
    console.log("ERR " + file);
    console.log("    " + error.message.split("\n").slice(0, 4).join("\n    "));
  }
}

process.exit(failed ? 1 : 0);

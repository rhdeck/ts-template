console.log("Starting");
const { readdirSync, writeFileSync, lstatSync } = require("fs");
const { join, basename } = require("path");
const { format } = require("prettier");
const base = ".";
const files = readdirSync(join(__dirname, base));
const arr = files
  .filter((file: string) => file !== "index.ts")
  .map((file: string) => {
    if (file === basename(__filename)) return undefined;
    const moduleName = basename(file, ".ts");
    const path = [__dirname, base, file].join("/");
    if (!lstatSync(path).isFile()) return undefined;
    const out = require(path);
    const keys = Object.keys(out);
    if (!keys.length) return ['require("./' + moduleName + '");', []];
    let i = "import ";
    let e: string[] = [];
    if (keys.includes("default")) {
      i = i + moduleName + " ";
      e.push(moduleName);
    }
    const namedExports = keys.filter((key) => key !== "default");
    if (namedExports.length) {
      if (keys.includes("default")) i = i + ",";
      i =
        i +
        " {" +
        namedExports.map((x) => x + " as " + moduleName + "_" + x).join(",") +
        "}";
      e.push(
        ...namedExports.map((x) => {
          return moduleName + "_" + x;
        })
      );
    }
    i = i + " from " + '"./' + moduleName + '";';
    return <[string, string[]]>[i, e];
  })
  .filter(Boolean);
const out =
  "/** THIS FILE IS AUTO_GENERATED - MODIFICATIONS MAY NOT BE SAVED */\n" +
  arr.map(([i]: [string]) => i).join("\n") +
  "\n export{" +
  arr
    .map(([_, e]: [string, string[]]) => e.join(","))
    .filter(Boolean)
    .join(",") +
  "};";
writeFileSync("./src/index.ts", format(out, { parser: "typescript" }));

const fs = require("fs");
const path = require("path");

const freeportPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "freeport-async",
  "index.js",
);

if (!fs.existsSync(freeportPath)) {
  process.exit(0);
}

const original = fs.readFileSync(freeportPath, "utf8");

if (original.includes("MAX_PORT = 65535")) {
  process.exit(0);
}

const patched = original
  .replace(
    "const DEFAULT_PORT_RANGE_START = 11000;",
    "const DEFAULT_PORT_RANGE_START = 11000;\nconst MAX_PORT = 65535;",
  )
  .replace(
    "    var awaitables = [];",
    "    if (lowPort + rangeSize - 1 > MAX_PORT) {\n      reject(new Error(`No available ports between ${DEFAULT_PORT_RANGE_START} and ${MAX_PORT}`));\n      return;\n    }\n    var awaitables = [];",
  );

fs.writeFileSync(freeportPath, patched);

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..", "src");

function collectJavaScriptFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const targetPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectJavaScriptFiles(targetPath);
    }

    return entry.name.endsWith(".js") ? [targetPath] : [];
  });
}

const files = collectJavaScriptFiles(rootDir).sort();

files.forEach((file) => {
  require(file);
});

console.log(`Validated ${files.length} backend source files.`);

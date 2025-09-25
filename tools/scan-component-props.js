/**
 * tools/scan-component-props.js
 * Usage: node tools/scan-component-props.js
 *
 * Scans components/**/*.tsx for exported "*Props" interfaces
 * and checks whether they extend a known React native attribute type.
 */

const fs = require("fs");
const path = require("path");

const nativePatterns = [
  "InputHTMLAttributes",
  "ButtonHTMLAttributes",
  "LabelHTMLAttributes",
  "SelectHTMLAttributes",
  "TextareaHTMLAttributes",
  "HTMLAttributes",
];

function walk(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(walk(full));
    } else if (full.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

function scanFile(file) {
  const content = fs.readFileSync(file, "utf8").split("\n");
  content.forEach((line, i) => {
    const match = line.match(/export\s+interface\s+(\w+Props)/);
    if (match) {
      const iface = match[1];
      const ok = nativePatterns.some((pat) => line.includes(pat));
      if (!ok) {
        console.log(`✳️ REVIEW: ${file}:${i + 1} — ${iface} may not extend native attributes`);
        console.log(`    ${line.trim()}`);
      } else {
        console.log(`✅ OK: ${file}:${i + 1} — ${iface}`);
      }
    }
  });
}

// run scan
const files = walk(path.join(__dirname, "..", "components"));
if (files.length === 0) {
  console.error("No components found.");
  process.exit(1);
}
files.forEach(scanFile);

console.log("\nScan complete.");

#!/usr/bin/env node
/**
 * tools/scan-component-props.js
 * Usage: node tools/scan-component-props.js
 *
 * Scans components/**/*.tsx for exported "*Props" interfaces
 * and checks whether they extend a known React native attribute type.
 *
 * Exits with code:
 *  0 -> no issues
 *  2 -> one or more REVIEW issues found
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

/**
 * Find export interface headers (handles multi-line headers)
 * Returns array of {iface, headerText, index}
 */
function findExportedProps(content) {
  const re = /export\s+interface\s+([A-Za-z0-9_]+Props)([\s\S]*?)\{/g;
  const results = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    const iface = m[1];
    const headerStart = m.index;
    const header = content.slice(headerStart, Math.min(content.length, headerStart + 1000)).split("{")[0];
    results.push({ iface, header, index: headerStart });
  }
  return results;
}

function scanFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const exported = findExportedProps(content);
  const issues = [];
  exported.forEach((e) => {
    const ok = nativePatterns.some((pat) => e.header.includes(pat));
    if (!ok) {
      issues.push(e);
    }
  });

  if (issues.length > 0) {
    issues.forEach((iss) => {
      // compute line number for context
      const lineNo = content.slice(0, iss.index).split("\n").length;
      const snippet = content.split("\n").slice(Math.max(0, lineNo - 2), lineNo + 8).join("\n");
      console.log(`\n✳️  REVIEW: ${file}:${lineNo} -> ${iss.iface}`);
      console.log(snippet.split("\n").map((l, idx) => `${(lineNo - 1 + idx + 1).toString().padStart(4)}: ${l}`).join("\n"));
      console.log("---");
    });
    return true;
  } else {
    exported.forEach((e) => {
      const lineNo = content.slice(0, e.index).split("\n").length;
      console.log(`✅ OK: ${file}:${lineNo} -> ${e.iface}`);
    });
    return false;
  }
}

/* main */
const base = path.join(process.cwd(), "components");
const files = walk(base);

if (files.length === 0) {
  console.error("No components found under ./components");
  process.exit(1);
}

let foundIssue = false;
files.forEach((f) => {
  try {
    const hasIssue = scanFile(f);
    if (hasIssue) foundIssue = true;
  } catch (err) {
    console.error("Error scanning", f, err && err.message);
  }
});

if (foundIssue) {
  console.log("\nOne or more REVIEW items found. Exiting non-zero to fail CI.");
  process.exit(2);
} else {
  console.log("\nScan complete. No REVIEW items found.");
  process.exit(0);
}

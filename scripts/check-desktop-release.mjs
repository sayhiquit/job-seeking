import { existsSync, readFileSync } from "node:fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

const failures = [];
const mainRs = readText("src-tauri/src/main.rs");
const tauriConfig = readJson("src-tauri/tauri.conf.json");
const packageJson = readJson("package.json");

function readWindowsSubsystem(path) {
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path);
  if (bytes.toString("ascii", 0, 2) !== "MZ") return null;
  const peOffset = bytes.readUInt32LE(0x3c);
  if (bytes.toString("ascii", peOffset, peOffset + 4) !== "PE\u0000\u0000") return null;
  const optionalHeaderOffset = peOffset + 4 + 20;
  return bytes.readUInt16LE(optionalHeaderOffset + 0x44);
}

if (!mainRs.includes('windows_subsystem = "windows"')) {
  failures.push("src-tauri/src/main.rs missing Windows GUI subsystem; release exe may open a CMD window.");
}

if (mainRs.includes('windows_subsystem = "console"')) {
  failures.push("src-tauri/src/main.rs uses console subsystem; release exe will open a CMD window.");
}

if (tauriConfig.build?.frontendDist !== "../dist") {
  failures.push('tauri.conf.json build.frontendDist must be "../dist" for packaged desktop builds.');
}

if (!tauriConfig.bundle?.active) {
  failures.push("tauri.conf.json bundle.active must be true before building installers.");
}

const targets = tauriConfig.bundle?.targets || [];
if (!Array.isArray(targets) || !targets.includes("nsis")) {
  failures.push('tauri.conf.json bundle.targets must include "nsis" for a Windows installer.');
}

const icons = tauriConfig.bundle?.icon || [];
if (!Array.isArray(icons) || !icons.some((icon) => String(icon).toLowerCase().endsWith(".ico"))) {
  failures.push("tauri.conf.json bundle.icon must include a Windows .ico icon.");
}

if (!packageJson.scripts?.["desktop:build"]?.includes("desktop:check")) {
  failures.push("package.json desktop:build must run desktop:check before tauri build.");
}

for (const exePath of ["src-tauri/target/release/jobfit-assistant.exe", "release/jobfit-assistant.exe"]) {
  const subsystem = readWindowsSubsystem(exePath);
  if (subsystem === 3) {
    failures.push(`${exePath} uses Windows Console subsystem; run npm run desktop:fix-subsystem before release.`);
  }
}

if (failures.length) {
  console.error("Desktop release check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Desktop release check passed: Windows GUI exe, NSIS installer, icon, and dist config are ready.");

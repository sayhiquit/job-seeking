import { existsSync, readFileSync, writeFileSync } from "node:fs";

const WINDOWS_GUI = 2;
const WINDOWS_CONSOLE = 3;

function subsystemName(value) {
  if (value === WINDOWS_GUI) return "Windows GUI";
  if (value === WINDOWS_CONSOLE) return "Windows Console";
  return `Unknown (${value})`;
}

function fixSubsystem(file) {
  if (!existsSync(file)) {
    console.log(`Skipped missing file: ${file}`);
    return;
  }

  const bytes = readFileSync(file);
  if (bytes.toString("ascii", 0, 2) !== "MZ") {
    throw new Error(`${file} is not a Windows executable.`);
  }

  const peOffset = bytes.readUInt32LE(0x3c);
  if (bytes.toString("ascii", peOffset, peOffset + 4) !== "PE\u0000\u0000") {
    throw new Error(`${file} has an invalid PE header.`);
  }

  const optionalHeaderOffset = peOffset + 4 + 20;
  const subsystemOffset = optionalHeaderOffset + 0x44;
  const current = bytes.readUInt16LE(subsystemOffset);

  if (current === WINDOWS_GUI) {
    console.log(`${file}: already ${subsystemName(current)}`);
    return;
  }

  if (current !== WINDOWS_CONSOLE) {
    throw new Error(`${file} uses unsupported subsystem ${subsystemName(current)}.`);
  }

  bytes.writeUInt16LE(WINDOWS_GUI, subsystemOffset);
  writeFileSync(file, bytes);
  console.log(`${file}: changed ${subsystemName(current)} -> ${subsystemName(WINDOWS_GUI)}`);
}

const files = process.argv.slice(2);
const targets = files.length
  ? files
  : ["src-tauri/target/release/jobfit-assistant.exe", "release/jobfit-assistant.exe"];

for (const file of targets) {
  fixSubsystem(file);
}

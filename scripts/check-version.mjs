import { readFileSync } from "node:fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

const changelogSource = readText("src/changelog.ts");
const changelogVersion = changelogSource.match(/version:\s*"([^"]+)"/)?.[1];

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const tauriConfig = readJson("src-tauri/tauri.conf.json");
const cargoToml = readText("src-tauri/Cargo.toml");
const cargoLock = readText("src-tauri/Cargo.lock");

const versions = [
  ["更新公告 currentChangelog", changelogVersion],
  ["package.json", packageJson.version],
  ["package-lock.json", packageLock.version],
  ["package-lock.json packages[\"\"]", packageLock.packages?.[""]?.version],
  ["src-tauri/tauri.conf.json", tauriConfig.version],
  ["src-tauri/Cargo.toml", cargoToml.match(/^version = "([^"]+)"/m)?.[1]],
  ["src-tauri/Cargo.lock jobfit-assistant", cargoLock.match(/name = "jobfit-assistant"\r?\nversion = "([^"]+)"/)?.[1]]
];

const missing = versions.filter(([, version]) => !version);
if (missing.length) {
  console.error("版本校验失败：以下位置没有读取到版本号");
  for (const [label] of missing) console.error(`- ${label}`);
  process.exit(1);
}

const uniqueVersions = new Set(versions.map(([, version]) => version));
if (uniqueVersions.size > 1) {
  console.error("版本校验失败：更新公告版本和安装包版本不一致");
  for (const [label, version] of versions) console.error(`- ${label}: ${version}`);
  process.exit(1);
}

console.log(`版本校验通过：${changelogVersion}`);

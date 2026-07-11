@echo off
setlocal
cd /d "%~dp0"
set "PATH=%CD%\.tools\node-v24.17.0-win-x64;%CD%\.tools\cargo\bin;%PATH%"
set "RUSTUP_HOME=%CD%\.tools\rustup"
set "CARGO_HOME=%CD%\.tools\cargo"
echo Starting desktop dev server...
echo If this window stays open, Tauri is building or waiting on dependencies.
npm run desktop:dev

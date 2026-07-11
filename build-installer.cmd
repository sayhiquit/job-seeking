@echo off
setlocal
cd /d "%~dp0"

echo Building installer package...
echo This may download or use cached Tauri bundling tools such as NSIS.
echo If the bundler fails, use package-desktop.cmd to produce the portable exe instead.

set "NODE_EXE=%CD%\.tools\node-v24.17.0-win-x64"
if exist "%NODE_EXE%\npm.cmd" (
  set "PATH=%NODE_EXE%;%PATH%"
)

npm run tauri build
if errorlevel 1 (
  echo.
  echo Installer build failed. Portable exe can still be built with:
  echo package-desktop.cmd
  exit /b 1
)

call npm run desktop:fix-subsystem -- "src-tauri/target/release/jobfit-assistant.exe"
if errorlevel 1 (
  echo.
  echo Installer was built, but the desktop exe subsystem check failed.
  exit /b 1
)

echo.
echo Installer output is usually under:
echo src-tauri\target\release\bundle
endlocal

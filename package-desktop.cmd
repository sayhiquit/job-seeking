@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
set "PATH=%CD%\.tools\node-v24.17.0-win-x64;%CD%\.tools\cargo\bin;%PATH%"
set "RUSTUP_HOME=%CD%\.tools\rustup"
set "CARGO_HOME=%CD%\.tools\cargo"
set "RUSTUP_TOOLCHAIN=stable-x86_64-pc-windows-msvc"

where link.exe >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" (
    for /f "usebackq tokens=*" %%i in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSINSTALL=%%i"
    if defined VSINSTALL if exist "!VSINSTALL!\VC\Auxiliary\Build\vcvars64.bat" call "!VSINSTALL!\VC\Auxiliary\Build\vcvars64.bat"
  )
)

where link.exe >nul 2>nul
if errorlevel 1 (
  echo.
  echo Missing Microsoft C++ Build Tools: link.exe was not found.
  echo Install "Visual Studio Build Tools 2022" and select "Desktop development with C++".
  echo Then run this file again.
  pause
  exit /b 1
)

echo Building Windows desktop exe...
call npm run tauri build -- --no-bundle
if errorlevel 1 (
  echo.
  echo Desktop exe build failed. Check the Tauri error above.
  pause
  exit /b 1
)

call npm run desktop:fix-subsystem -- "src-tauri/target/release/jobfit-assistant.exe"
if errorlevel 1 (
  echo.
  echo Failed to switch the desktop exe to Windows GUI subsystem.
  pause
  exit /b 1
)

if not exist release mkdir release

tasklist /fi "imagename eq jobfit-assistant.exe" | find /i "jobfit-assistant.exe" >nul 2>nul
if not errorlevel 1 (
  echo Closing running jobfit-assistant.exe before replacing release file...
  taskkill /f /im jobfit-assistant.exe >nul 2>nul
  timeout /t 1 /nobreak >nul
)

del /q "release\*.exe" >nul 2>nul
del /q "release\*.msi" >nul 2>nul
copy /y "src-tauri\target\release\jobfit-assistant.exe" "release\jobfit-assistant.exe" >nul
call npm run desktop:fix-subsystem -- "release/jobfit-assistant.exe"

if /i "%~1"=="installer" (
  echo Building optional installer...
  call npm run desktop:build
  if errorlevel 1 (
    echo Installer bundling failed, but release\jobfit-assistant.exe is ready.
  ) else (
    if exist "src-tauri\target\release\bundle" (
      for /r "src-tauri\target\release\bundle" %%f in (*.msi *.exe) do (
        if "%%~nxf" neq "jobfit-assistant.exe" copy /y "%%f" "release\" >nul
      )
    )
  )
)

echo.
echo Done. Output files copied to:
echo %CD%\release
echo Tip: run package-desktop.cmd installer only when NSIS download/cache is available.
pause

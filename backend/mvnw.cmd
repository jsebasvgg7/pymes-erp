@echo off
setlocal enabledelayedexpansion

set MVN_VERSION=3.9.9
set DIST_DIR=%~dp0.mvn\wrapper\dists\apache-maven-%MVN_VERSION%
set MVN_EXE=%DIST_DIR%\apache-maven-%MVN_VERSION%\bin\mvn.cmd

if exist "%MVN_EXE%" (
  "%MVN_EXE%" %*
  exit /b %ERRORLEVEL%
)

set ZIP_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MVN_VERSION%/apache-maven-%MVN_VERSION%-bin.zip
set ZIP_FILE=%DIST_DIR%\apache-maven-%MVN_VERSION%-bin.zip

if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%ZIP_FILE%'" || exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%DIST_DIR%' -Force" || exit /b 1

if not exist "%MVN_EXE%" exit /b 1

"%MVN_EXE%" %*
exit /b %ERRORLEVEL%


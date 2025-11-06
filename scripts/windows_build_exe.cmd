@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Steg 1: hitta projektmappen (en nivå upp från denna fil)
set "PROJECT_DIR=%~dp0.."
for %%I in ("%PROJECT_DIR%") do set "PROJECT_DIR=%%~fI"

if not exist "%PROJECT_DIR%" (
    echo Kunde inte hitta projektmappen. Avslutar.
    exit /b 1
)

echo.
echo === Går till projektmappen ===
cd /d "%PROJECT_DIR%" || exit /b 1

REM Steg 2: skapa virtuell miljö om den saknas
if not exist .venv (
    echo Skapar virtuell Python-miljö i .venv ...
    py -m venv .venv || goto :error
)

echo.
echo === Aktiverar miljön ===
call .venv\Scripts\activate.bat || goto :error

REM Steg 3: uppdatera pip och installera krav
py -m pip install --upgrade pip || goto :error
py -m pip install -r requirements.txt || goto :error
py -m pip install pyinstaller || goto :error

REM Steg 4: Bygg .exe med PyInstaller
py -m PyInstaller -F -n aktiescanner_cli -m aktiescanner.cli || goto :error

echo.
echo === Klar! ===
echo Filen finns i %PROJECT_DIR%\dist\aktiescanner_cli.exe
pause
exit /b 0

:error
echo.
echo Något gick fel. Läs meddelandet ovan och försök igen.
pause
exit /b 1

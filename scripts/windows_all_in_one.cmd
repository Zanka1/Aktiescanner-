@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM  Aktiescanner all-in-one-lösning för Windows
REM  Dubbelklicka på den här filen eller kör den från Kommandotolken.
REM  Scriptet gör tre saker åt dig:
REM    1. Ställer in Python-miljön och kör en snabb rapport (5 bolag).
REM    2. Startar backend-servern i ett eget fönster.
REM    3. Startar frontend (webbsidan) i ett eget fönster.
REM  Målet är att du bara behöver den här filen – inga andra kommandon.
REM ================================================================

set "PROJECT_ROOT=%~dp0.."
if not exist "%PROJECT_ROOT%\README.md" (
  echo Kunde inte hitta projektets README.md bredvid skriptet.
  echo Kontrollera att du inte har flyttat bara skriptfilen.
  pause
  exit /b 1
)

pushd "%PROJECT_ROOT%"

echo === [1/6] Byter till projektmappen "%PROJECT_ROOT%" ===

if not exist .venv (
  echo === [2/6] Skapar virtuell Python-miljo (.venv) ===
  py -m venv .venv
  if errorlevel 1 (
    echo Misslyckades med att skapa den virtuella miljön. Kontrollera att Python ar installerat.
    popd
    pause
    exit /b 1
  )
) else (
  echo === [2/6] Virtuell Python-miljo hittad ===
)

echo === [3/6] Aktiverar Python-miljon och installerar beroenden ===
call .venv\Scripts\activate.bat
if errorlevel 1 (
  echo Kunde inte aktivera den virtuella miljön.
  popd
  pause
  exit /b 1
)
py -m pip install --upgrade pip
if errorlevel 1 (
  echo Kunde inte uppdatera pip.
  popd
  pause
  exit /b 1
)
py -m pip install -r requirements.txt
if errorlevel 1 (
  echo Kunde inte installera beroenden. Kontrollera internetanslutning eller filen requirements.txt.
  popd
  pause
  exit /b 1
)

echo === [4/6] Kor en snabb uppdatering (5 bolag, offline-vanligt) ===
py -m aktiescanner.cli update --no-download --limit 5
if errorlevel 1 (
  echo Uppdateringen misslyckades. Se felmeddelandet ovan.
  popd
  pause
  exit /b 1
)

echo === [5/6] Forbereder backend (Node) ===
where npm >nul 2>&1
if errorlevel 1 (
  echo Kunde inte hitta npm. Installera Node.js fran nodejs.org om du vill anvanda webbgranssnittet.
) else (
  pushd webapp\backend
  if not exist node_modules (
    echo Installerar backend-paket (detta kan ta ett par minuter forsta gangen)...
    npm install
    if errorlevel 1 (
      echo npm install misslyckades i backend. Avbryter Node-delen.
      popd
      goto frontend
    )
  ) else (
    echo Backend-paket redan installerade.
  )
  start "Aktiescanner Backend" cmd /k "cd /d %cd% && npm run dev"
  popd
)

:frontend
where npm >nul 2>&1
if errorlevel 1 (
  goto finish
)

pushd webapp\frontend
if not exist node_modules (
  echo Installerar frontend-paket (detta kan ta ett par minuter forsta gangen)...
  npm install
  if errorlevel 1 (
    echo npm install misslyckades i frontend. Kontrollera felmeddelandet.
    popd
    goto finish
  )
) else (
  echo Frontend-paket redan installerade.
)
start "Aktiescanner Frontend" cmd /k "cd /d %cd% && npm run dev"
popd

:finish
echo === [6/6] Klart! ===
echo Rapporten finns i "%PROJECT_ROOT%\reports\stockholm_large_midcap_metrics.csv".
echo Backend- och frontend-fonster (om startade) ar oppna med titlarna "Aktiescanner Backend" och "Aktiescanner Frontend".
echo Stang dem nar du vill avsluta servern/webbappen.
pause
popd
exit /b 0

@echo off
setlocal enabledelayedexpansion

REM ================================================
REM  Aktiescanner snabbstart för Windows-kommandotolken
REM  1. Dubbelklicka på den här filen eller kör den från cmd.
REM  2. Scriptet försöker hitta projektmappen automatiskt.
REM  3. Det skapar en virtuell miljö, installerar beroenden och
REM     kör en snabb uppdatering på fem bolag.
REM ================================================

echo [1/6] Letar efter Aktiescanner-mappen...
set "PROJECT_PATH="
for /f "delims=" %%P in ('powershell -NoLogo -NoProfile -Command "Get-ChildItem -Directory -Path $env:USERPROFILE -Filter 'Aktiescanner-' -Recurse | Select-Object -First 1 -ExpandProperty FullName"') do set "PROJECT_PATH=%%P"

if not defined PROJECT_PATH (
  echo Kunde inte hitta en mapp som heter Aktiescanner- under %%USERPROFILE%%.
  echo Flytta den här filen till samma mapp som projektet eller skriv in sökvägen manuellt.
  set /p PROJECT_PATH=Ange hela sökvägen (t.ex. C:\Users\bjorn\Desktop\Aktiescanner-): 
)

if not defined PROJECT_PATH (
  echo Ingen sökväg angavs. Avslutar.
  exit /b 1
)

if not exist "%PROJECT_PATH%" (
  echo Sökvägen "%PROJECT_PATH%" finns inte. Kontrollera stavningen och försök igen.
  exit /b 1
)

echo [2/6] Byter till mappen "%PROJECT_PATH%".
pushd "%PROJECT_PATH%"

if exist .venv (
  echo [3/6] Virtuell miljö hittades.
) else (
  echo [3/6] Skapar virtuell miljö (.venv)...
  py -m venv .venv
  if errorlevel 1 (
    echo Misslyckades med att skapa virtuell miljö. Kontrollera att Python är installerat.
    popd
    exit /b 1
  )
)

echo [4/6] Aktiverar virtuell miljö.
call .venv\Scripts\activate.bat
if errorlevel 1 (
  echo Kunde inte aktivera den virtuella miljön.
  popd
  exit /b 1
)

echo [5/6] Installerar/uppdaterar beroenden...
py -m pip install --upgrade pip
if errorlevel 1 (
  echo Kunde inte uppdatera pip.
  popd
  exit /b 1
)
py -m pip install -r requirements.txt
if errorlevel 1 (
  echo Kunde inte installera beroenden.
  popd
  exit /b 1
)

echo [6/6] Kör en snabb uppdatering (5 bolag) utan nedladdning...
py -m aktiescanner.cli update --no-download --limit 5
if errorlevel 1 (
  echo Uppdateringen misslyckades. Läs felmeddelandet ovan för detaljer.
  popd
  exit /b 1
)

echo.
echo Klart! Rapporten finns i "%PROJECT_PATH%\reports\stockholm_large_midcap_metrics.csv".
pause
popd
exit /b 0

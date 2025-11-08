# Aktiescanner

Detta projekt innehåller ett Python-verktyg som hämtar och analyserar börsdata
för nordiska bolag via Yahoo Finance. Fokus ligger på Stockholmsbörsens large
- och midcap-listor men strukturen är förberedd för att enkelt kunna utökas
till Oslo- och Köpenhamnsbörsen.

## Funktioner

* Hämtar bolagslistor automatiskt från Nasdaq OMX Nordic när anslutning är
  tillgänglig och faller tillbaka på en lokalt cachad CSV-fil.
* Beräknar centrala nyckeltal: värdering enligt en Buffett-inspirerad DCF,
  Magic Formula (Joel Greenblatt), avkastning på kapital, samt utdelningsdata.
* Sparar resultatet i en CSV-rapport som kan öppnas i exempelvis Excel eller
  Google Sheets.
* Kan köras manuellt när du vill uppdatera siffrorna, vilket gör det enkelt
  att schemalägga dagliga körningar via GitHub Codespaces, GitHub Actions eller
  lokala cron-jobb.

## Kom igång

### Var ligger instruktionerna jag ska läsa?

* **Steg 1 – öppna Utforskaren:** klicka på den gula mappikonen längst ned på
  skärmen eller tryck `Windows` + `E`.
* **Steg 2 – gå till platsen där du packade upp projektet.** Har du följt
  guiden längre ned ligger mappen i `Dokument` → `GitHub` → `Bolag` och heter
  exakt `Aktiescanner-` (med ett streck på slutet).
* **Steg 3 – dubbelklicka på mappen `Aktiescanner-`.** Nu ser du filerna som
  ingår. En av dem heter `README` eller `README.md`. Filändelsen `.md` kan
  ibland döljas av Windows, så det är helt okej om du bara ser ordet
  `README`.
* **Steg 4 – öppna filen.** Högerklicka på `README` → välj **Öppna med** →
  **Anteckningar** (eller **Notepad**). Du kan också dra in filen i VS Code.
* När jag uppdaterar guiden är det alltid denna fil du ska läsa om igen.
  Därför behöver du aldrig leta på andra ställen eller gissa vad som gäller.
* I mappen `scripts` finns färdiga "fusklappar" (`windows_quickstart.cmd` och
  `windows_build_exe.cmd`) om du hellre dubbelklickar dig fram.

### Två kodblock – allt startar automatiskt (Windows)

Vill du bara kopiera och klistra in? Följ de här tre punkterna. Då behöver du
bara **två** kodrutor.

1. Öppna **Kommandotolken**.
2. Klistra in **Kodblock 1** för att hoppa till rätt mapp.
3. Klistra in **Kodblock 2** för att låta skriptet göra resten automatiskt.

**Kodblock 1 – gå till projektmappen** (klar att klistra in för mappen
`C:\Users\bjorn\Documents\GitHub\Bolag\Aktiescanner-`):

```text
cd "C:\\Users\\bjorn\\Documents\\GitHub\\Bolag\\Aktiescanner-"
```

*Citattecknen (`"`) måste vara med om sökvägen innehåller mellanslag. Det är
helt okej att klistra in exakt som det står ovan.*

**Kodblock 2 – kör allt-i-ett-skriptet**:

```text
scripts\windows_all_in_one.cmd
```

Skriptet gör tre saker åt dig:

1. Det skapar/aktiverar Python-miljön och kör en snabb rapport på fem bolag.
2. Det startar backend-servern i ett nytt fönster (rubriken blir
   `Aktiescanner Backend`).
3. Det startar frontend-hemsidan i ett annat fönster (rubriken blir
   `Aktiescanner Frontend`).

När båda fönstren är öppna går du till webbläsaren och surfar till
`http://localhost:5173` för att se screenern. Rapportfilen finns i
`C:\Users\bjorn\Documents\GitHub\Bolag\Aktiescanner-\reports\stockholm_large_midcap_metrics.csv`.

> 🟦 **Valfritt Kodblock 3 – kör om bara rapporten**
>
> Vill du vid ett senare tillfälle bara uppdatera siffrorna utan att starta
> webbgränssnittet kör du (efter Kodblock 1):
>
> ```text
> call .venv\Scripts\activate.bat && py -m aktiescanner.cli update
> ```
>
> På så sätt håller du dig fortfarande inom önskemålet om högst tre kodblock.

### Snabbguide – exakt vad du ska göra (Windows, steg för steg)

Följ punkterna i ordning. Stryk på dem allt eftersom – då missar du inget.

1. **Packa upp projektet**
   1. Högerklicka på zip-filen du fick → välj **Extrahera alla**.
   2. När den nya mappen visas ska den heta **precis** `Aktiescanner-`.
      * Om du byter namn: använd bara bokstäver (A–Ö) och siffror. Undvik
        extra tecken. Mellanslag går bra, men då behöver du citattecken senare.
   3. Flytta hela mappen `Aktiescanner-` till mappen
      `C:\Users\bjorn\Documents\GitHub\Bolag`.
      * Om mapparna `GitHub` eller `Bolag` inte finns ännu: skapa dem genom att
        högerklicka i Utforskaren → **Ny** → **Mapp** och skriv namnet exakt som
        här.
      * När du är klar ska sökvägen högst upp i Utforskaren visa
        `Den här datorn > Dokument > GitHub > Bolag > Aktiescanner-`.
      * Filen `README.md` ligger nu inuti `Aktiescanner-`-mappen.

2. **Öppna Kommandotolken**
   1. Tryck `Windows`-tangenten.
   2. Skriv `cmd`.
   3. Välj programmet **Kommandotolken**.

3. **Gå in i mappen `Aktiescanner-`**
   1. Skriv exakt det här (kopiera gärna) och tryck Enter:

      ```text
      cd "C:\\Users\\bjorn\\Documents\\GitHub\\Bolag\\Aktiescanner-"
      ```

      *Kommandot börjar med `cd` (för "change directory").*
      *Dubbel-bakslascharna (`\\`) behövs när du klistrar in i Kommandotolken.*

   2. Om du någon gång väljer en annan plats kan du byta ut sökvägen. Exempel
      för en mapp som heter `Aktie Program` i Dokument:

      ```text
      cd "%USERPROFILE%\Documents\Aktie Program"
      ```

      > **Notera:** citattecken **måste** vara med när sökvägen innehåller
      > mellanslag. Utan citattecken tror datorn att du startar ett program.

4. **Skapa (eller öppna) den virtuella Python-miljön**

   Kopiera raden här under (inget framför, inget efter) och tryck Enter:

   ```text
   py -m venv .venv && call .venv\Scripts\activate.bat
   ```

   * Första delen `py -m venv .venv` skapar en mapp som heter `.venv`. Där
     lagras alla Python-paket. Kommandot körs bara första gången – efter det
     hoppar det snabbt vidare till andra delen.
   * Andra delen `call .venv\Scripts\activate.bat` aktiverar miljön. När den
     är aktiv står det `(.venv)` i början av raden i Kommandotolken.

5. **Installera allt som behövs**

   Skriv (eller kopiera) raden och tryck Enter:

   ```text
   py -m pip install --upgrade pip && py -m pip install -r requirements.txt
   ```

   * Först uppdateras `pip`.
   * Sedan läser `pip` filen `requirements.txt`. Filen innehåller just nu bara en
     kommentar, så kommandot går snabbt och du vet att allt är klart när raden
     slutar med `(.venv) C:\...>` igen.

6. **Kör programmet (snabbtest på fem bolag)**

   Klistra in raden nedan och tryck Enter:

   ```text
   py -m aktiescanner.cli update --no-download --limit 5
   ```

   * Programmet räknar på fem bolag med de siffror som följer med i projektet.
   * Resultatet sparas i mappen `reports` som skapas automatiskt.
   * Om internet är spärrat där du sitter skriver programmet ett meddelande i
     kolumnen `notes` i stället för siffror.

7. **Hitta rapporten**

   1. Öppna Utforskaren.
   2. Gå till `Dokument` → `GitHub` → `Bolag` → öppna mappen `Aktiescanner-` →
      öppna mappen `reports`.
   3. Dubbelklicka på filen `stockholm_large_midcap_metrics.csv`. Den öppnas i
      Excel om du har det installerat. Annars kan du importera den i Google
      Sheets.

8. **Kör hela listan med färska data (när du har internet)**

   Ersätt kommandot i steg 6 med raden här nedanför och tryck Enter:

   ```text
   py -m aktiescanner.cli update
   ```

   * Nu laddas hela listan från nätet, räknas om och sparas i samma CSV-fil.

9. **Avsluta eller köra igen**

   * Stäng terminalfönstret när du är klar.
   * Nästa gång du vill köra programmet: börja på punkt 2, kör steg 3 för att
     komma in i mappen, skriv `call .venv\Scripts\activate.bat` för att aktivera
     miljön (du behöver inte skapa den igen) och fortsätt med steg 6.

> 💡 **Så vet du att du är på rätt plats:** raden i Kommandotolken slutar med
> något i stil med `(.venv) C:\Users\bjorn\Documents\GitHub\Bolag\Aktiescanner->`. Om du
> ser ett annat mappnamn – använd `cd` tills det står `Aktiescanner-`.

## Förklarat som för en 12-åring

Tänk på programmet som en mycket hjälpsam Excel-fil som fyller i siffrorna åt
dig.

1. **Du behöver Python** – det är som spelet/programmet som kör allt. Installera
   det från [python.org](https://www.python.org/downloads/) om du inte redan har
   det.
2. **Öppna en terminal** (svart ruta där man skriver kommandon). På Windows kan
   du använda "Kommandotolken" eller "PowerShell". På Mac öppnar du "Terminal".
3. **Gå till projektmappen**. Om du sparade projektet i mappen `Aktiescanner-`
   skriver du:

   ```text
   cd "%USERPROFILE%\Desktop\Aktiescanner-"
   ```

   Har din mapp ett mellanslag i namnet (t.ex. `AktieProgram Scanner`)? Skriv
   då citattecken runt hela sökvägen:

   ```text
   cd "C:\\Users\\dittNamn\\Desktop\\AktieProgram Scanner"
   ```

   > **Viktigt:** I Kommandotolken på Windows ska du bara skriva själva
   > kommandot – alltså `cd ...` – och sedan trycka Enter. Orden som står ovanför
   > kodrutan (till exempel "bash" eller "text") är bara etiketter i
   > dokumentationen och ska inte skrivas i terminalen.

4. **Kör allt-i-ett-skriptet**. När du står i mappen skriver du:

   ```text
   scripts\windows_all_in_one.cmd
   ```

   Nu händer tre saker automatiskt: Python-rapporten körs, backend startas och
   frontend öppnas. Lämna fönstren öppna så länge du vill använda programmet.

   Vill du lära dig hur man gör allt för hand? Fortsätt med punkterna här
   nedanför – de gör exakt samma sak som skriptet fast steg för steg.

4. **Installera hjälpverktygen** (Python-biblioteken). Skriv detta och tryck
   Enter:

   ```text
   pip install -r requirements.txt
   ```

   Det är som att ladda ned lego-bitarna som programmet behöver. Filen
   `requirements.txt` innehåller bara en kommentar just nu, så kommandot går
   klart nästan direkt men det skadar inte att köra det.
5. **Kör programmet**. Första gången kan du testa den snabba varianten som inte
   behöver internet:

   ```text
   python -m aktiescanner.cli update --no-download --limit 5
   ```

   Nu räknar programmet på de fem första bolagen och gör en CSV-fil (en tabell).
   Den sparas i mappen `reports` och heter `stockholm_large_midcap_metrics.csv`.
6. **Öppna filen i Excel eller Google Sheets**. Du får en tabell med kolumner
   som `Intrinsic (BuffettDCF) kr/aktie`, `Buffett Undervärdering %`,
   Magic Formula-poäng och andra nyckeltal.
7. **Vill du ta med alla bolag och få färska siffror?** Kör samma kommando men
   utan `--limit 5` och utan `--no-download`:

   ```text
   python -m aktiescanner.cli update
   ```

### Kopiera-och-klistra-in-lösning (Windows)

Om du bara vill kopiera ett block text till Kommandotolken kan du använda
följande kommando. Det letar automatiskt upp mappen `Aktiescanner-` under din
användarmapp (`C:\Users\dittNamn`) och kör sedan programmet med de fem första
bolagen. Markera allt som står i rutan nedan, högerklicka i Kommandotolken och
välj **Klistra in**:

```bat
for /f "delims=" %P in ('powershell -NoLogo -NoProfile -Command "Get-ChildItem -Directory -Path $env:USERPROFILE -Filter 'Aktiescanner-' -Recurse | Select-Object -First 1 -ExpandProperty FullName"') do set "PROJECT_PATH=%P"
if not defined PROJECT_PATH (echo Hittade inte mappen Aktiescanner-. Kontrollera att du packade upp projektet. & goto :eof)
cd /d "%PROJECT_PATH%"
if not exist .venv (py -m venv .venv)
call .venv\Scripts\activate.bat
py -m pip install --upgrade pip
py -m pip install -r requirements.txt
py -m aktiescanner.cli update --no-download --limit 5
echo Färdigt! Rapporten ligger i %PROJECT_PATH%\reports\stockholm_large_midcap_metrics.csv
pause
```

> Kommandot använder PowerShell i bakgrunden bara för att hitta mappen. Själva
> analysen körs fortfarande i Kommandotolken.

### Kör samma sak via färdig skriptfil (Windows)

I mappen `scripts` finns nu **två** hjälpare beroende på hur mycket du vill göra
med ett klick:

* `windows_all_in_one.cmd` – gör allt i ett svep (Python-rapport + startar
  backend och frontend). Detta är samma skript som Kodblock 2 kör.
* `windows_quickstart.cmd` – kör bara Python-delen (fem bolag utan nät).

Gör så här om du hellre dubbelklickar på en fil:

1. Kopiera hela projektmappen `Aktiescanner-` till exempelvis Skrivbordet.
2. Dubbelklicka på `scripts\windows_all_in_one.cmd` (eller
   `windows_quickstart.cmd` om du bara vill ha rapporten).
3. Följ instruktionerna i fönstret. Allt sker i rätt ordning och skriptet talar
   om vad som händer.
4. När skriptet är klart ligger rapporten i
   `Aktiescanner-\reports\stockholm_large_midcap_metrics.csv`. Om du valde
   all-in-one-varianten är dessutom backend och frontend igång i egna fönster.

### Extra steg-för-steg för Windows

Använd den här listan om du sitter vid en vanlig Windows-dator och inget av
kommandona verkar fungera direkt:

1. Tryck på Windows-tangenten, skriv **"Kommandotolken"** och öppna programmet.
2. Skriv `dir` och tryck Enter för att se vilka mappar som finns i den nuvarande
   mappen.
3. Om du inte ser mappen `Aktiescanner-` kan du använda `cd` för att byta
   plats, till exempel `cd Desktop` om du sparade projektet på skrivbordet.
4. När du är i rätt mapp ska raden börja med något som liknar
   `C:\Users\dittNamn\Aktiescanner->`. Nu fungerar kommandot `cd Aktiescanner-`.
   Om du inte hittar mappen kan du i stället använda kommandoblocket ovan som
   automatiskt letar reda på den åt dig.
5. På Windows kan det vara enklare att skriva `py -m pip install -r requirements.txt`
   i stället för `pip install -r requirements.txt`. Båda gör samma sak.
6. På samma sätt kan du köra programmet med `py -m aktiescanner.cli update` om
   `python`-kommandot inte känns igen.
7. Får du fortfarande felmeddelandet *"Det går inte att hitta sökvägen"* betyder
   det att du inte står i rätt mapp. Upprepa steg 2–4 tills kommandot fungerar.

8. **Kör igen när du vill uppdatera siffrorna.** Filen skrivs över med nya
   värden varje gång.

Tips: Om något felmeddelande dyker upp, läs vad det står. Ofta handlar det om
internetanslutning eller att ett bolag saknar data. Prova igen eller lägg till
`--limit 5` för att felsöka.

### Vanligt fel: `The term 'C:\Users\...\AktieProgram Scanner' is not recognized`

Det här felmeddelandet i PowerShell betyder att du skrev in **sökvägen** (t.ex.
`C:\Users\bjorn\Desktop\AktieProgram Scanner`) utan att först skriva kommandot
`cd`. Datorn tror då att du försöker starta ett program som heter exakt så. Gör
så här i stället:

1. Skriv `cd` och ett mellanslag.
2. Dra mappen från Utforskaren in i PowerShell-fönstret **eller** klistra in
   sökvägen men sätt citattecken runt den.

   ```text
   cd "C:\\Users\\bjorn\\Desktop\\AktieProgram Scanner"
   ```

3. Tryck Enter. Nu står du i rätt mapp och prompten slutar med `>` efter
   mappnamnet.
4. Fortsätt med stegen längre upp (installera paket, köra kommandot osv.).

### Gör ett eget .exe-program (Windows)

Tänk på ett `.exe` som en färdig lunchlåda: vi packar allt du behöver i en fil
så att du kan dubbelklicka på den. Så här gör du, steg för steg:

1. **Öppna Kommandotolken** (som när du körde programmet innan).
2. **Gå till projektmappen** `Aktiescanner-` med `cd` som tidigare.
3. **Klistra in kommandot nedan** och tryck Enter. Det installerar PyInstaller
   (verktyget som bygger `.exe`) och skapar filen i mappen `dist`.

   ```text
   py -m pip install pyinstaller && py -m PyInstaller -F -n aktiescanner_cli -m aktiescanner.cli
   ```

   * `-F` betyder "gör allt till en fil".
   * `-n aktiescanner_cli` ger filen ett namn.
   * `-m aktiescanner.cli` säger åt PyInstaller att starta från vårt program.

4. **Vänta tills det står "completed successfully".** Nu finns filen
   `dist\aktiescanner_cli.exe`. Dubbelklicka på den för att köra programmet utan
   att öppna en terminal.
5. **Vill du uppdatera eller ändra koden?** Inga problem! Gör dina ändringar i
   Python-filerna, spara dem och kör samma PyInstaller-kommando igen. Den
   ersätter den gamla `.exe`-filen med en ny version.

> Tips: Om du hellre vill dubbelklicka dig igenom allt finns även skriptet
> `scripts\windows_build_exe.cmd`. Det gör exakt samma sak som kommandot ovan
> men guidar dig rad för rad och talar om när det är klart.

## Nästa steg

* Lägg till ytterligare börser genom att köra `update` med `--exchange no`
  (Oslo) eller `--exchange co` (Köpenhamn) och skapa egna fallback-filer.
* Integrera kommandot i GitHub:s "Plug and Play"-flöde eller andra scheduler
  för automatiska dagsuppdateringar.
* Anpassa kolumnerna i CSV-filen genom att ändra `metrics_to_dataframe` i
  `aktiescanner/metrics.py`.


## Nytt: Finviz-lik webbscreener (frontend + backend)

> **Till dig (12-åringsförklaring):** Tänk att vi har byggt en hemsida som ser ut som Finviz. Du har två mappar:
> * `webapp/backend` – här bor servern (hjärnan) som hämtar data och räknar indikatorer.
> * `webapp/frontend` – här bor hemsidan (ansiktet) som visar tabellen, filtren och nyheterna.

### Snabb överblick

1. **Backend (Node + TypeScript)**
   * Fil: `webapp/backend/src/server.ts` – startar Express-servern, importerar marknader och skickar tabellen till frontend.
   * Fil: `webapp/backend/src/scheduler.ts` – en "robot" som vaknar var 6:e timme och uppdaterar pris & nyheter (gratis API-gränser).
   * Fil: `webapp/backend/src/import.ts` – läser CSV/XLSX från Yahoo Finance och bygger upp listan på bolag.
   * Kör med: `cd webapp/backend && npm install && npm run dev`.

2. **Frontend (React + Vite)**
   * Fil: `webapp/frontend/src/App.tsx` – hela Finviz-layouten (topprad, filter, tabell, nyhetsruta, importknapp).
   * Fil: `webapp/frontend/src/components/` – små byggstenar: `TopBar`, `FilterPanel`, `ResultsTable`, `ImportModal`, `NewsDrawer`.
   * Kör med: `cd webapp/frontend && npm install && npm run dev`.
   * Webbläsaren öppnar `http://localhost:5173` automatiskt (bakänden proxas via Vite).


3. **Kopiera & klistra in (Windows)**

   ```powershell
   cd Aktiescanner-\webapp\backend
   npm install
   npm run dev
   ```
   Öppna en ny terminal:

   ```powershell
   cd Aktiescanner-\webapp\frontend
   npm install
   npm run dev
   ```
   Nu ser du screenern på `http://localhost:5173`.

### Exakt hur du kör webbscreenern (Windows)

Följ de här punkterna om du vill att det ska bli rätt första gången.

1. **Öppna två Kommandotolkar** (du behöver ett fönster för backend och ett för frontend).

2. **Backend-fönstret**
   1. Klistra in raden nedan och tryck Enter. Den tar dig till backend-mappen.

      ```text
      cd "%USERPROFILE%\Desktop\Aktiescanner-\webapp\backend"
      ```

   2. Installera Node-paketen (behöver göras första gången):

      ```text
      npm install
      ```

   3. Starta servern:

      ```text
      npm run dev
      ```

      * Fönstret ska nu visa texten `API on :3000`. Låt det fönstret stå öppet –
        servern jobbar i bakgrunden.

3. **Frontend-fönstret**
   1. I det andra Kommandotolksfönstret: byt mapp till frontend.

      ```text
      cd "%USERPROFILE%\Desktop\Aktiescanner-\webapp\frontend"
      ```

   2. Installera webbpaketen (första gången):

      ```text
      npm install
      ```

   3. Starta webbplatsen:

      ```text
      npm run dev
      ```

      * Efter några sekunder står det `Local: http://localhost:5173/`.
      * Tryck på länken (Shift + högerklick → Markera → Enter) eller skriv in
        adressen i din webbläsare.

4. **Vad händer nu?**
   * Backend-fönstret tar emot alla kommandon från hemsidan. Om något blir fel
     (t.ex. saknad API-nyckel) syns det som ett rött felmeddelande här.
   * Frontend-fönstret bygger sidan och uppdaterar den när du sparar filer.
   * När du stänger av: tryck `Ctrl + C` i respektive fönster. Gör det först i
     frontend, sedan i backend.

5. **Importera nya marknader (utan att skriva kod)**
   * På webbsidan klickar du på **Importera marknad** längst upp.
   * Skriv in ett kort namn (t.ex. `USA`) och välj filen från Yahoo Finance.
   * Klicka **Importera**. Efter några sekunder dyker bolagen upp i tabellen.

> 💡 Tips: Om `npm install` klagar på att kommandot saknas behöver du installera
> Node.js från [https://nodejs.org](https://nodejs.org). Välj LTS-versionen.

4. **Importera en ny marknad**
   * Klicka på knappen **Importera marknad** i toppen.
   * Fyll i id (t.ex. `USA`), namn, valuta och tidszon.
   * Välj filen du laddade ned från Yahoo Finance (`.csv` eller `.xlsx`).
   * Klicka **Importera** – servern läser filen och tabellen fylls direkt.

5. **Vad händer i bakgrunden?**
   * Priser hämtas från Alpha Vantage (`src/providers.ts`).
   * Nyheter hämtas från NewsAPI.
   * Indikatorer (SMA/EMA/RSI/MACD/Stochastic/ATR/ADX/Bollinger) räknas lokalt i `src/indicators.ts`.
   * Signaler (MA-korsning, RSI etc.) används i filter och i kolumnen **Signals**.

6. **Spara filter (presets)**
   * Frontend hämtar listan via `GET /api/presets`.
   * Du kan posta egna filter med `POST /api/presets` (se `webapp/backend/src/server.ts`).
   * Presets visas i rullistan "Mina sparade filter" högst upp.

7. **Teman & mobilvy**
   * Mörkt läge är standard. Klicka på knappen `🌙 Mörkt` för att växla.
   * På små skärmar staplas filtren under varandra och tabellen går att scrolla i sidled.

8. **Schema (gratisnivå)**
   * Priser & indikatorer: var 6:e timme.
   * Nyheter: var 6:e timme (startar 15 min efter pris-jobbet).
   * Du kan ändra intervallet i `webapp/backend/src/scheduler.ts`.

9. **Filer du kan öppna för att förstå allt**
   * `webapp/backend/.env.example` – visar vilka API-nycklar du behöver.
   * `webapp/frontend/public/chart.html` – enkel minigraf när du klickar på en ticker.
   * `webapp/frontend/src/index.css` – färger & scroll-stil.

> **Tips:** om något krånglar, öppna terminalen där servern körs. Fel skrivs ut där med tydliga svenska texter (t.ex. "Importen misslyckades").

10. **Dubbelkolla beräkningarna automatiskt**
    * Kör enheten `python -m unittest tests.test_metrics` i projektroten.
    * Testerna bekräftar att Buffett-DCF, kassaflödesmodellen och Magic Formula-rankningen räknar rätt värden.
    * Kommandot går igenom utan internetåtkomst eftersom vi använder inbyggda exempelvärden.


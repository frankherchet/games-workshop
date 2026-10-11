# ComputerSys Games

Erste spielbare Version für **games.computersys.de**: Modern Arcade mit Pixelgrafiken, Türkis, dunklen Flächen und gut lesbarer Schrift.

## Enthalten

- Responsive Startseite, Suche und Kategorien.
- Eigene, direkt verlinkbare Spielansichten über `#spiel/neon-breakout`, `#spiel/memory-quest` und `#spiel/pixel-runner`.
- Neon Breakout: 40 Blöcke, drei Leben, Maus, Touch und Tastatur.
- Memory Quest: acht Paare, Tastaturbedienung und Bestwert nach Zügen.
- Pixel Runner: sieben Sterne, Sprünge, Abgründe, Stacheln und Zielportal.
- Pause, Neustart und lokale Bestwerte. Keine Konten, kein Tracking, keine externen Fonts oder CDN-Abhängigkeiten. Diese Version hat keine Audioeffekte.

## Entwickeln und prüfen

Node.js 22+ und Python 3 genügen. Keine Paketinstallation notwendig.

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
npm run check
```

Der Build erzeugt `dist/index.html` als vollständige, eigenständig ausführbare Webseite. Diese Datei kann als lokale Vorschau geöffnet oder auf den Webspace geladen werden. JavaScript-Quellen bleiben in `src/` getrennt; der Build fügt sie zusammen. `.htaccess` wird zusätzlich vorbereitet, vom Deployment jedoch nicht übertragen, damit bestehende Hostingeinstellungen erhalten bleiben.

## Veröffentlichungen

**Noch keine öffentliche Veröffentlichung.** Der Prüfworkflow startet bei Änderungen; der Veröffentlichungsworkflow startet ausschließlich manuell und lädt nur `dist/index.html` hoch.

GitHub-Environment **allinkl**:

| Typ | Name | Inhalt |
| --- | --- | --- |
| Secret | FTP_HOST | ALL-INKL-Servername ohne Protokoll/Port, passend zum TLS-Zertifikat |
| Secret | FTP_USER | Auf das Spieleverzeichnis eingeschränkter FTP-Benutzer |
| Secret | FTP_PASSWORD | Dessen Passwort |
| Variable | FTP_REMOTE_DIR | Explizites Zielverzeichnis aus Sicht dieses FTP-Benutzers |

Wenn der eingeschränkte Benutzer bereits direkt im Verzeichnis der Subdomain startet, ist `FTP_REMOTE_DIR` gleich `/`. Andernfalls muss der im KAS bestätigte Pfad eingetragen werden. Nicht raten: Ein falscher Pfad könnte eine andere Website überschreiben.

Vor der ersten Veröffentlichung:

1. Design und Spiele auf Computer, iPad und Smartphone prüfen.
2. Betreiberangaben für Impressum/Datenschutz ergänzen. Das Vorschaufenster enthält derzeit nur einen transparenten Projektstatus.
3. Subdomain-Verzeichnis und HTTPS bestätigen; bestehenden Inhalt sichern.
4. Optional unter Environment `allinkl` einen Required Reviewer konfigurieren, damit GitHub die Freigabe zusätzlich erzwingt.
5. Nach ausdrücklicher Freigabe **Actions → Publish to ALL-INKL → Run workflow**, Branch `main`, Bestätigung `games.computersys.de`.

Der Uploader verwendet explizites FTPS mit Zertifikatsprüfung und verschlüsseltem Datenkanal. Er lädt zuerst eine temporäre Datei, kontrolliert ihre Größe und benennt sie in `index.html` um. Es gibt kein rekursives Löschen und keinen FTP-Klartext-Fallback. Danach prüft er den öffentlich ausgelieferten HTML-Inhalt über HTTPS. Secrets werden nicht in Dateien geschrieben oder ausgegeben. FTPS und das Verhalten beim Ersetzen per Rename müssen beim ersten freigegebenen Deployment am echten Server geprüft werden.

## Wiederherstellung

Jede Version liegt in Git. Für einen Rollback den gewünschten Stand als neuen Commit auf `main` wiederherstellen, Prüfungen durchlaufen lassen und denselben freigegebenen Deployment-Workflow starten. Zusätzlich werden Veröffentlichungspakete 90 Tage als Actions-Artefakte aufbewahrt. Der erste Upload setzt eine vorhandene lokale Sicherung des bisherigen Zielverzeichnisses voraus.

## Weitere Spiele hinzufügen

1. `src/games/<spiel>.js` mit einer Factory unter `Arcade.games['<id>']` ergänzen.
2. Einen Katalogeintrag in `src/catalog.js` und eine Vorschaugrafik in `src/art.js` hinzufügen.
3. Das Skript in der Reihenfolge von `scripts/build.js` eintragen.
4. Die Factory liefert `start`, `pause`, `reset`, `dispose`; Ereignislistener, Animationen und Timer werden beim Verlassen entfernt. Die Plattform stellt `score`, `status`, `finish` und `pause` bereit.
5. Für ein neues Genre oder einen anderen Bestwertmodus das gemeinsame UI entsprechend erweitern. Zuerst Spiellogik prüfen, danach Browser- und Gerätetests durchführen.

## Stand der Prüfung

Die enthaltenen automatisierten Tests prüfen Plattformkollisionen, erreichbare Sprünge, die Memory-Kartenverteilung und Schutzmechanismen des Uploaders. Sie ersetzen keine visuelle oder reale Geräteprüfung. Browser- und Hostingprüfung stehen vor der ersten öffentlichen Freigabe aus.

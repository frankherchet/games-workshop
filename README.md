# ComputerSys Games

Browsergame-Plattform für **games.computersys.de**: Modern Arcade mit Pixelgrafiken, Türkis, dunklen Flächen und gut lesbarer Schrift.

## Enthalten

- Responsive Startseite, Suche und Kategorien.
- Vollbild bei allen Spielen: native Fullscreen-API mit bildschirmfüllendem Browser-Fallback, proportional angepasstem Spielfeld, erreichbarer Steuerung und Rückkehr per Button oder Escape. Die tatsächliche Anzeige auf dem iPad muss noch geprüft werden.
- Eigene, direkt verlinkbare Spielansichten über `#spiel/neon-breakout`, `#spiel/memory-quest` und `#spiel/pixel-runner`.
- Schneckenkampf: märchenhafte Gartenpflege, Nachtkämpfe, drei freischaltbare Gärten, Shop und lokale Spielstände. Details: [Spielkonzept und Prüfstand](docs/schneckenkampf.md).
- **Pferdezauber – 3D-Prototyp V2:** Frei begehbare Low-Poly-Pferdewiese (WebGL ohne CDN), Startmenü mit **6 Pferdevarianten** (2 Fohlen, Shetlandpony, Welsh-Pony, Haflinger, Friese) und unterschiedlichen Farben, Größen und Geschwindigkeiten. Mensch + Begleitpferd oder nur Pferd, Figurenwechsel (Q), Verwandlung (T), drei Lichtfunken zum Sammeln, Gangarten und Springen; auch mit Touch-Steuerung. **Noch kein vollständiges Spiel, keine Online-Konten und kein Spielstand.** [V2-Testseite](https://games.computersys.de/pferdezauber-demo-v2-20261012/) · [Issue #1](https://github.com/frankherchet/games-workshop/issues/1).
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

Der Build erzeugt `dist/index.html` mit zusammengefügtem Code und einer lokal gehosteten PNG-Grafik in `dist/assets/`. Für die Veröffentlichung müssen beide übertragen werden. `dist/schneckenkampf.html` enthält die Grafik eingebettet und dient als eigenständige Vorschau. JavaScript-Quellen bleiben in `src/` getrennt; der Build fügt sie zusammen. `.htaccess` wird zusätzlich vorbereitet, vom Deployment jedoch nicht übertragen, damit bestehende Hostingeinstellungen erhalten bleiben.

## Veröffentlichungen

**Die Plattform ist veröffentlicht. Neue Änderungen werden nur nach Freigabe manuell veröffentlicht.** Der Prüfworkflow startet bei Änderungen; der Veröffentlichungsworkflow startet ausschließlich manuell und lädt nur `dist/index.html` hoch.

GitHub-Environment **allinkl**:

| Typ | Name | Inhalt |
| --- | --- | --- |
| Secret | FTP_HOST | ALL-INKL-Servername ohne Protokoll/Port, passend zum TLS-Zertifikat |
| Secret | FTP_USER | Auf das Spieleverzeichnis eingeschränkter FTP-Benutzer |
| Secret | FTP_PASSWORD | Dessen Passwort |
| Workflow-Einstellung | FTP_REMOTE_DIR | Bestätigtes Ziel `/`, im manuellen Workflow fest eingetragen |

Der aktuelle Workflow verwendet das vom Betreiber bestätigte Ziel `/`. Bei einem Wechsel des FTP-Benutzers oder Zielverzeichnisses muss die Zuordnung vor einem erneuten Upload bestätigt werden.

Vor der ersten Veröffentlichung:

1. Design und Spiele auf Computer, iPad und Smartphone prüfen.
2. Betreiberangaben für Impressum/Datenschutz ergänzen. Das Vorschaufenster enthält derzeit nur einen transparenten Projektstatus.
3. Subdomain-Verzeichnis und HTTPS bestätigen; bestehenden Inhalt sichern.
4. Optional unter Environment `allinkl` einen Required Reviewer konfigurieren, damit GitHub die Freigabe zusätzlich erzwingt.
5. Nach ausdrücklicher Freigabe **Actions → Publish to ALL-INKL → Run workflow**, Branch `main`, Bestätigung `games.computersys.de`.

Der Uploader verwendet explizites FTPS mit Zertifikatsprüfung und verschlüsseltem Datenkanal. Er lädt zuerst die im Manifest aufgeführten, mit Inhalts-Hash benannten Grafiken und zuletzt `index.html`. Jede Datei wird temporär übertragen, auf ihre Größe geprüft und per Rename veröffentlicht. Alte Grafiken bleiben für einen möglichen Rollback erhalten. Es gibt kein rekursives Löschen und keinen FTP-Klartext-Fallback. Danach prüft er die öffentlich ausgelieferten HTML- und Bildinhalte über HTTPS. Secrets werden nicht in Dateien geschrieben oder ausgegeben. FTPS, Ersetzen per Rename und HTTPS-Verifikation wurden beim ersten Plattform-Deployment erfolgreich geprüft.

## Wiederherstellung

Jede Version liegt in Git. Für einen Rollback den gewünschten Stand als neuen Commit auf `main` wiederherstellen, Prüfungen durchlaufen lassen und denselben freigegebenen Deployment-Workflow starten. Zusätzlich werden Veröffentlichungspakete 90 Tage als Actions-Artefakte aufbewahrt. Der erste Upload setzt eine vorhandene lokale Sicherung des bisherigen Zielverzeichnisses voraus.

## Pferdezauber lokal testen

Die ersten 3D-Spielfunktionen sind im Arcade-Katalog unter `#spiel/pferdezauber` zu finden. In **V2** kann vor dem Start zwischen sechs Fohlen-, Pony- und Großpferd-Varianten gewählt werden. Nach `npm run build` kann `dist/index.html` direkt im Browser geöffnet werden. Der Prototyp verwendet native WebGL-Geometrie, keine externen Bibliotheken und benötigt **kein Node.js auf dem Server**. Die bestehende manuelle Veröffentlichungsfreigabe bleibt unverändert.

Desktop: WASD/Pfeiltasten bewegen, Q zur anderen Figur wechseln, T Mensch↔Pferd, G Gangart, Leertaste springen, Mausziehen für Kamera. Touch: Richtungstasten und Aktionsschaltflächen; Finger auf der Spielfläche drehen die Kamera. Die Demo enthält bewusst noch keine Konten, keine Online-Speicherung und keine vollständigen Abenteuer; das sind spätere Entwicklungspakete. Ein erfolgreicher automatisierter Build ersetzt **keine** Browser-/Mobilgerätetests.

## Weitere Spiele hinzufügen

1. `src/games/<spiel>.js` mit einer Factory unter `Arcade.games['<id>']` ergänzen.
2. Einen Katalogeintrag in `src/catalog.js` und eine Vorschaugrafik in `src/art.js` hinzufügen.
3. Das Skript in der Reihenfolge von `scripts/build.js` eintragen.
4. Die Factory liefert `start`, `pause`, `reset`, `dispose`; Ereignislistener, Animationen und Timer werden beim Verlassen entfernt. Die Plattform stellt `score`, `status`, `finish` und `pause` bereit.
5. Für ein neues Genre oder einen anderen Bestwertmodus das gemeinsame UI entsprechend erweitern. Zuerst Spiellogik prüfen, danach Browser- und Gerätetests durchführen.

## Stand der Prüfung

Die enthaltenen automatisierten Tests prüfen Plattformkollisionen, erreichbare Sprünge, die Memory-Kartenverteilung und Schutzmechanismen des Uploaders. Sie ersetzen keine visuelle oder reale Geräteprüfung. Browser- und Hostingprüfung stehen vor der ersten öffentlichen Freigabe aus.

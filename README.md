# ComputerSys Games

Browsergame-Plattform für **games.computersys.de**: Modern Arcade mit Pixelgrafiken, Türkis, dunklen Flächen und gut lesbarer Schrift.

## Enthalten

- **Fluglotse – Airport Chaos:** Eigenständiges Canvas-2D-Fluglotsenspiel mit vier Welten (Provinz, Insel, Stadt, Wüstenstadt), 48 Stages, Flugrouten per Maus/Touch, zufällig generierten Flugplätzen, zunehmend dichtem Luftverkehr und Drei-Sterne-System. Architekturentscheidungen und Arbeitspakete: [Issue #23](https://github.com/frankherchet/games-workshop/issues/23).
- **Frogger – Weltenhüpfer:** Neon-Spiel in Canvas 2D mit fünf Welten und 50 festen Levels, Verkehr, Plattformmitfahrt, Ampeln, sinkenden Blättern, Eisrutschen und Portalen. Sterne, Bestzeiten und Freischaltung werden lokal gespeichert. Tastatur, Wischen, Richtungsbuttons, Pause und Vollbild. [Spielkonzept, Implementierungsplan und Prüfstand](docs/frogger.md). Noch nicht veröffentlicht; echte iPad-/Smartphone-Abnahme und Spielbalance sind offen.
- Responsive Startseite, Suche und Kategorien.
- Vollbild bei allen Spielen: native Fullscreen-API mit bildschirmfüllendem Browser-Fallback, proportional angepasstem Spielfeld, erreichbarer Steuerung und Rückkehr per Button oder Escape. Die tatsächliche Anzeige auf dem iPad muss noch geprüft werden.
- Eigene, direkt verlinkbare Spielansichten über `#spiel/neon-breakout`, `#spiel/memory-quest` und `#spiel/pixel-runner`.
- Schneckenkampf: märchenhafte Gartenpflege, Nachtkämpfe, drei freischaltbare Gärten, Shop und lokale Spielstände. Details: [Spielkonzept und Prüfstand](docs/schneckenkampf.md).
- **Pferdezauber – Führen, Reitmode und weichere Landschaft (Test):** Im Duo-Modus mit Mensch neben das Pferd gehen, **L** oder den Touch-Knopf **„🤝 Führen“** drücken: Der Mensch hält eine sichtbare 3D-Zügelleine bis zum Pferdekopf und das Pferd läuft seitlich in Griffnähe mit; erneutes Drücken lässt los und das Pferd bleibt stehen. Weiterhin freies Folgen und Reiten möglich. Vor dem Start Auswahl zwischen **Reithelm & Jacke, Westernhut & Weste, Kappe & Sportjacke**; die ausgewählten Outfits sind auch beim Reiten sichtbar. Die Landschaft erhält geschwungene Wege, runde Baumwipfel, weichere Ufer, mehr Hügel und abgerundete Grasflächen. Alles weiterhin rein lokal im Browser, ohne Multiplayer.
- **Pferdezauber – Reiten und Ausrüstung:** Im Duo-Modus kann der Mensch auf Ponys und Großpferde auf- und absteigen (<kbd>M</kbd> oder der sichtbare Touch-Knopf). Während des Reitens sitzt ein animierter Low-Poly-Mensch auf dem Pferd; das Begleitpferd hat Sattel, Satteldecke, Steigbügel, Trense und Zügel. Im Sattel steuert man das Pferd mit WASD und wechselt mit G die Gangart. Auf- und Absteigen sind unabhängig vom Pferd-Allein-Modus (Q) und von der magischen Verwandlung (T). **Fohlen sind nicht reitbar.** Die Vorschau bleibt eine kostenlose Browser-Demo ohne Account/Spielstand.
- **Pferdezauber – Lebendige Pferdewelt (V4-Test):** [Jetzt testen](https://games.computersys.de/pferdezauber-lebendige-welt-20261013/) · drei Pferdeherden, eine Ponygruppe und eine Fohlenwiese (17 zusätzliche Tiere); acht spazierende Menschen in Paaren, sechs Hasen und zehn Vögel. Die Weidetiere bewegen sich in festen Gruppen und grasen gelegentlich; neue statische Hofdekorationen füllen die Umgebung. Hintergrundfiguren werden auf Mobilgeräten durch Entfernungsausblendung, einfachere Fernmodelle und aktualisierte GPU-Daten mit etwa 10 FPS entlastet. **Weiterhin allein spielbar**, ohne Account/Server-Spiellogik. Für die Testseite wurde ausschließlich ein neuer FTPS-Ordner angelegt; die Live-Startseite blieb unverändert.\n- **Pferdezauber – Abenteuer-Demo:** Frei begehbare Low-Poly-Pferdewiese (WebGL ohne CDN), Startmenü mit **6 Pferdevarianten** (2 Fohlen, Shetlandpony, Welsh-Pony, Haflinger, Friese) und unterschiedlichen Farben, Größen und Geschwindigkeiten. Mensch + Begleitpferd oder nur Pferd, deutlich sichtbarer Wechsel zu **„🐎 Pferd spielen“** (Q), eigener **Mensch-Temposchalter** mit Gehen/Rennen/Sprinten (R), Verwandlung (T), eine Fohlenrettung mit Hufspuren und langsamem Heimführen, drei Fähigkeitssteine und eine erweckbare Lichtquelle mit Lichtkranz als Belohnung, Gangarten und Springen; auch mit Touch-Steuerung. **Noch kein vollständiges Spiel, keine Online-Konten und kein Spielstand.** [Ältere V2-Testseite](https://games.computersys.de/pferdezauber-demo-v2-20261012/) · [Issue #1](https://github.com/frankherchet/games-workshop/issues/1).
- Neon Breakout: 40 Blöcke, drei Leben, Maus, Touch und Tastatur.
- Memory Quest: acht Paare, Tastaturbedienung und Bestwert nach Zügen.
- Pixel Runner: sieben Sterne, Sprünge, Abgründe, Stacheln und Zielportal.
- Pause, Neustart und lokale Bestwerte. Keine Konten, kein Tracking, keine externen Fonts oder CDN-Abhängigkeiten. Diese Version hat keine Audioeffekte.

## Entwickeln und prüfen

Node.js 22+, Python 3 und PHP 8.1+ mit cURL und mbstring genügen. Keine Paketinstallation notwendig.

```bash
npm test
php -l server/feedback.php
php tests/feedback.test.php
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
npm run check
```

Der Build erzeugt `dist/index.html` mit zusammengefügtem Code und einer lokal gehosteten PNG-Grafik in `dist/assets/`. Für die Veröffentlichung müssen beide übertragen werden. `dist/schneckenkampf.html` enthält die Grafik eingebettet und dient als eigenständige Vorschau. JavaScript-Quellen bleiben in `src/` getrennt; der Build fügt sie zusammen. `.htaccess` wird zusätzlich vorbereitet, vom Deployment jedoch nicht übertragen, damit bestehende Hostingeinstellungen erhalten bleiben.

## Veröffentlichungen

**Die Plattform ist veröffentlicht. Neue Änderungen werden nur nach Freigabe manuell veröffentlicht.** Der Prüfworkflow startet bei Änderungen; der Veröffentlichungsworkflow startet ausschließlich manuell und lädt HTML, Grafiken und den PHP-Endpunkt hoch.

GitHub-Environment **allinkl**:

| Typ | Name | Inhalt |
| --- | --- | --- |
| Secret | FTP_HOST | ALL-INKL-Servername ohne Protokoll/Port, passend zum TLS-Zertifikat |
| Secret | FTP_USER | Auf das Spieleverzeichnis eingeschränkter FTP-Benutzer |
| Secret | FTP_PASSWORD | Dessen Passwort |
| Secret | FEEDBACK_GITHUB_TOKEN | Fine-grained GitHub-Token nur für dieses Repository, Issues: write |
| Workflow-Einstellung | FTP_REMOTE_DIR | Bestätigtes Ziel `/`, im manuellen Workflow fest eingetragen |

Der aktuelle Workflow verwendet das vom Betreiber bestätigte Ziel `/`. Bei einem Wechsel des FTP-Benutzers oder Zielverzeichnisses muss die Zuordnung vor einem erneuten Upload bestätigt werden.

Vor der ersten Veröffentlichung:

1. Design und Spiele auf Computer, iPad und Smartphone prüfen.
2. Betreiberangaben für Impressum/Datenschutz ergänzen. Das Vorschaufenster enthält derzeit nur einen transparenten Projektstatus.
3. Subdomain-Verzeichnis und HTTPS bestätigen; bestehenden Inhalt sichern.
4. Optional unter Environment `allinkl` einen Required Reviewer konfigurieren, damit GitHub die Freigabe zusätzlich erzwingt.
5. Nach ausdrücklicher Freigabe **Actions → Publish to ALL-INKL → Run workflow**, Branch `main`, Bestätigung `games.computersys.de`.

Der Uploader verwendet explizites FTPS mit Zertifikatsprüfung und verschlüsseltem Datenkanal. Er lädt zuerst die im Manifest aufgeführten, mit Inhalts-Hash benannten Grafiken und zuletzt `index.html`. Jede Datei wird temporär übertragen, auf ihre Größe geprüft und per Rename veröffentlicht. Alte Grafiken bleiben für einen möglichen Rollback erhalten. Es gibt kein rekursives Löschen und keinen FTP-Klartext-Fallback. Danach prüft er die öffentlich ausgelieferten HTML- und Bildinhalte über HTTPS. FTP-Secrets werden nicht in Dateien geschrieben oder ausgegeben. Der Feedback-Token wird ausschließlich in der geschützten PHP-Konfiguration auf dem Server gespeichert. FTPS, Ersetzen per Rename und HTTPS-Verifikation wurden beim ersten Plattform-Deployment erfolgreich geprüft.


## Bugs und Feature-Wünsche

„Bug / Wunsch“ öffnet auf allen Seiten ein kleines Popup. Der Nutzer wählt Bug oder Feature und beschreibt sein Anliegen (10–4000 Zeichen). Automatisch angehängt werden Seitenpfad und Route (ohne URL-Suchparameter), Spielname/ID, Build-Hash, Browserkennung, Sprache, Fenstergröße, Pixeldichte und Zeitpunkt beim Öffnen. Die Daten können vor dem Senden eingesehen werden. Keine Spielstände, Kontaktdaten oder Konsolenlogs werden gesammelt. Der Hinweis im Popup erklärt, dass die Meldung in einem öffentlichen GitHub-Issue landet.

In den Vollbild-Spielansichten gibt es ebenfalls einen Meldebutton; er verlässt das Vollbild und öffnet das Formular. Laufende Arcade- und Schneckenkampf-Runden werden pausiert, Pferdezauber-Tasten werden freigegeben. Nach dem Schließen kann man weiterspielen. Fehler erhalten den eingegebenen Text; nach erfolgreichem Senden wird die Issue-Nummer angezeigt.

Das Frontend sendet nur an den eigenen `feedback.php`-Endpunkt. Dieser legt Issues im fest vorgegebenen Repository `frankherchet/games-workshop` mit `[Bug]` oder `[Feature]` im Titel an. Der Token braucht laut [GitHub-Dokumentation](https://docs.github.com/en/rest/issues/issues#create-an-issue) ausschließlich Repository-Zugriff mit **Issues: write**. Als Secret `FEEDBACK_GITHUB_TOKEN` im GitHub-Environment `allinkl` hinterlegen; nicht ins Repository oder HTML schreiben.

Beim manuellen Deployment wird erst der Endpunkt übertragen und über HTTPS geprüft, ob PHP mit cURL/mbstring ausgeführt wird. Erst danach wird der Token über FTPS aus dem Arbeitsspeicher in `feedback-config.php` geschrieben. Auch temporäre Konfigurationsdateien enden auf `.php`; direkter Webzugriff liefert 404. Der Token liegt weder im Build-Verzeichnis noch in Actions-Artefakten. Der Webspace muss PHP ausführen; die Serverkonfiguration darf PHP-Quelltexte niemals als Download ausliefern. PHP-Sessions und ein beschreibbares System-Temp-Verzeichnis müssen verfügbar sein.

POSTs erfordern den Seiten-Origin und einen Sitzungstoken. Der Endpunkt begrenzt auf fünf Versuche pro IP und 30 insgesamt pro rollender Stunde, mit einer gesperrten Datei im System-Temp-Verzeichnis; dort werden nur gehashte IPs und Zeitpunkte für diese Stunde gespeichert. Fehlgeschlagene GitHub-Aufrufe zählen mit. Das begrenzt Spam, verhindert gezielten Missbrauch eines öffentlichen Formulars aber nicht vollständig. Bei Bedarf kann der Betreiber den Endpunkt sperren und den Token widerrufen. Nutzertexte werden für Markdown maskiert, insbesondere GitHub-Erwähnungen.

Lokal: `npm run build`, anschließend `php -S 127.0.0.1:8087 -t dist`. Popup und Fehlerfälle funktionieren ohne Token. Produktive POSTs akzeptieren nur `https://games.computersys.de` als Origin. Ein echter GitHub-Aufruf und die ALL-INKL-PHP-Konfiguration werden erst bei der freigegebenen Veröffentlichung geprüft. Der bestehende manuelle Veröffentlichungsprozess bleibt bestehen.

## Wiederherstellung

Jede Version liegt in Git. Für einen Rollback den gewünschten Stand als neuen Commit auf `main` wiederherstellen, Prüfungen durchlaufen lassen und denselben freigegebenen Deployment-Workflow starten. Zusätzlich werden Veröffentlichungspakete 90 Tage als Actions-Artefakte aufbewahrt. Der erste Upload setzt eine vorhandene lokale Sicherung des bisherigen Zielverzeichnisses voraus.

## Pferdezauber lokal testen

Die ersten 3D-Spielfunktionen sind im Arcade-Katalog unter `#spiel/pferdezauber` zu finden. In der Abenteuer-Demo kann vor dem Start zwischen sechs Fohlen-, Pony- und Großpferd-Varianten gewählt werden. Nach `npm run build` kann `dist/index.html` direkt im Browser geöffnet werden. Der Prototyp verwendet native WebGL-Geometrie, keine externen Bibliotheken und benötigt **kein Node.js auf dem Server**. Die bestehende manuelle Veröffentlichungsfreigabe bleibt unverändert.

Desktop: WASD/Pfeiltasten bewegen, Q zur anderen Figur wechseln, T Mensch↔Pferd, G Gangart, E interagieren, Leertaste springen, Mausziehen für Kamera. Die Zielanzeige führt durch die Fohlenrettung und das Lichtstein-Abenteuer; Lumi wartet, wenn du sie im Galopp zurücklässt. Der Hufstein verlangt eine Pferdefigur, der Sprungstein eine Aktivierung in der Luft. Beide Spielmodi einschließlich Fohlen können die Geschichte abschließen. Touch: Richtungstasten und Aktionsschaltflächen; Finger auf der Spielfläche drehen die Kamera. Die Demo enthält bewusst noch keine Konten, keine Online-Speicherung und keine vollständigen Abenteuer; das sind spätere Entwicklungspakete. Ein erfolgreicher automatisierter Build ersetzt **keine** Browser-/Mobilgerätetests.

## Weitere Spiele hinzufügen

1. `src/games/<spiel>.js` mit einer Factory unter `Arcade.games['<id>']` ergänzen.
2. Einen Katalogeintrag in `src/catalog.js` und eine Vorschaugrafik in `src/art.js` hinzufügen.
3. Das Skript in der Reihenfolge von `scripts/build.js` eintragen.
4. Die Factory liefert `start`, `pause`, `reset`, `dispose`; Ereignislistener, Animationen und Timer werden beim Verlassen entfernt. Die Plattform stellt `score`, `status`, `finish` und `pause` bereit.
5. Für ein neues Genre oder einen anderen Bestwertmodus das gemeinsame UI entsprechend erweitern. Zuerst Spiellogik prüfen, danach Browser- und Gerätetests durchführen.

## Stand der Prüfung

Die enthaltenen automatisierten Tests prüfen Plattformkollisionen, erreichbare Sprünge, die Memory-Kartenverteilung und Schutzmechanismen des Uploaders. Sie ersetzen keine visuelle oder reale Geräteprüfung. Browser- und Hostingprüfung stehen vor der ersten öffentlichen Freigabe aus.

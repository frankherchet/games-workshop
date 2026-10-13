# Frogger – Implementierungsplan

Grundlage: [Spielkonzept](frogger.md), gewählter Neon-Stil in 2,5D mit Canvas 2D. Umsetzung in dieser Reihenfolge, nachvollziehbare Commits pro Milestone im Frogger-PR #7. Keine automatische Veröffentlichung oder Zusammenführung.

## Milestones und Abhängigkeiten

| Milestone | Ergebnis | Voraussetzung | Abnahme |
| --- | --- | --- | --- |
| M1 · Spielbarer Kern | Deterministische Simulation, Neon-Darstellung, Tastatur/Touch und Sonnenauen 1-01 bis 1-03 im Katalog | Konzept | Bewegungen, Verkehr, Plattformmitfahrt und Levelende getestet; Browserdurchlauf |
| M2 · Sonnenauen & Fortschritt | Alle zehn Gartenlevels, Auswahl, Sterne, Bestzeiten, Rettung, bestätigtes Zurücksetzen und validierter lokaler Fortschritt | M1 | Freischaltung, Wiederholung, Speicherfehler mit Hinweis und alle zehn Karten geprüft |
| M3 · Stadt & Dschungel | Neonhafen und Dschungelruinen, je zehn Levels; Ampeln, Warnungen, Fährenhalt, unabhängiger Einsatzverkehr, sinkende Plattformen und angekündigte Strömung | M2 | Phasen mit Grenzfällen getestet; Karten und Erreichbarkeit geprüft |
| M4 · Eis & Orbit | Polarlichter und Orbitalgarten, je zehn Levels; Eis-Zusatzschritt, Windphasen, Teleportation, Schleusen und Energiebalken | M3 | Rutschgrenzen und sichere Portalankunft getestet; vollständige 50-Level-Daten |
| M5 · Bedienung & Neon-Feinschliff | Lesbare Weltgestaltung, Auswahl, Pause, Vollbild, Wischen und reduzierte Bewegung | M4 | Desktop-/mobile Browsergrößen, Fokus, Touch und Spielwechsel geprüft |
| M6 · Kampagnenprüfung | Gesamte Kampagne und Integration geprüft, Dokumentation mit ehrlichem Prüfstand | M5 | Node-Tests, Python-Uploadertests, Build und Check erfolgreich; Browsernachweise und offene echte Gerätetests dokumentiert |

Milestones sind Ergebnisgrenzen, keine zugesagten Kalendertermine. M3 und M4 enthalten jeweils zwei getrennte Welt-Issues; Umsetzung bleibt sequenziell. Veröffentlichung und echte Geräteabnahme können nicht durch reine Simulation ersetzt werden.

## Umsetzungsschnitt

- `frogger-levels.js`: 50 feste Karten mit IDs, Reihen, Start/Ziel, Sammelobjekten, Rettungsfreund und Weltmechaniken. Wiederkehrende Reihenformen verwenden kleine vorhandene Datenmuster, keine Zufallskarten.
- `frogger-model.js`: rasterbezogene Schritte, aktive Zeit, dynamische Gefahren, Plattformmitfahrt, Eis, Portale und Fortschrittsvalidierung; ohne DOM testbar.
- `frogger-art.js`: prozedurale Canvas-2D-Neonzeichnung mit schräger Darstellung, fünf Weltpaletten, sichtbaren Gefahren und Landeflächen. Konzeptbild ist Referenz, kein Spielfeld-Hintergrund mit unveränderlichen Hindernissen.
- `frogger-game.js` und `frogger-style.css`: Custom-Factory wie bestehende Spiele; Auswahl, HUD, Steuerung und Lifecycle. Vorhandenen Vollbildcontroller nutzen; allgemeine Session nicht erweitern, weil sie keinen Vier-Richtungs-Input für Custom-Spiele bereitstellt.
- Katalog, Vorschau und Build laden das Spiel; `tests/frogger*.test.js` sichern Regeln und Integration. Keine neuen Abhängigkeiten oder Serverfunktionen.

## Prüfstrategie

Simulationsschritte bleiben klein und deterministisch. Testfälle prüfen schnelle kreuzende Fahrzeuge, korrekt mitfahrende Plattformen, sichere Wartezonen, Status nach Treffer, Neustart, Sammelziele, Eis-Zusatzbewegung, Portalsperre und Speichergrenzen. Jede Karte wird auf gültige Daten und einen zeitlich möglichen Weg zum Ziel überprüft; Rettungslevels müssen den Freund erreichen. Browserprüfung ergänzt die Logiktests um sichtbare Darstellung und Eingaben.

Performance wird am Browserprototyp beobachtet; echte iPad-/Smartphone-Messungen bleiben ausdrücklich offen, wenn kein reales Gerät verfügbar ist. Weder Milestone noch Issue erhält einen erfundenen Gerätenachweis. Ein fertiger Implementierungsschritt wird mit Commit und Prüfung im zugehörigen GitHub-Issue kommentiert; automatische Issue-Schließung erst nach vollständiger Abnahme.

## GitHub-Issues

Die veröffentlichten Issues enthalten Ziel, Umfang, Voraussetzungen, Given/When/Then-Abnahme, Prüfungen und bekannte Grenzen. M1 bis M5 sind im PR implementiert und zur Review bereit. Die Issues bleiben bis zum PR-Merge offen; M6 bleibt zusätzlich bis zur echten Geräteabnahme offen.

| Issue | Milestone | Status |
| --- | --- | --- |
| [#8 · Frogger M1: Spielkern und drei spielbare Neon-Levels](https://github.com/frankherchet/games-workshop/issues/8) | M1 | Implementiert · PR-Review |
| [#9 · Frogger M2: Zehn Sonnenauen-Levels und lokaler Fortschritt](https://github.com/frankherchet/games-workshop/issues/9) | M2 | Implementiert · PR-Review |
| [#10 · Frogger M3a: Neonhafen mit zehn Levels und Verkehrsphasen](https://github.com/frankherchet/games-workshop/issues/10) | M3 | Implementiert · PR-Review |
| [#11 · Frogger M3b: Dschungel mit zehn Levels und sinkenden Plattformen](https://github.com/frankherchet/games-workshop/issues/11) | M3 | Implementiert · PR-Review |
| [#12 · Frogger M4a: Polarlichter mit zehn Levels und Eisrutschen](https://github.com/frankherchet/games-workshop/issues/12) | M4 | Implementiert · PR-Review |
| [#13 · Frogger M4b: Orbitalgarten mit zehn Levels und sicheren Portalen](https://github.com/frankherchet/games-workshop/issues/13) | M4 | Implementiert · PR-Review |
| [#14 · Frogger M5: Neon-Welten und zugängliche Bedienung fertigstellen](https://github.com/frankherchet/games-workshop/issues/14) | M5 | Implementiert · PR-Review |
| [#15 · Frogger M6: Gesamtkampagne prüfen und Prüfstand dokumentieren](https://github.com/frankherchet/games-workshop/issues/15) | M6 | Automatik/Browser bestanden · Geräteabnahme offen |

## Nachweise pro Milestone

| Milestone | Commit | Nachweis |
| --- | --- | --- |
| M1 | `a432190` | Fünf Kernprüfungen, Build/Check; Browserabschluss von 1-01 |
| M2 | `5636a4c` | Zehn Karten, Sterne/Bestzeiten/Rettung/Speicher; Browser-Neuladen und Rücksetzabbruch |
| M3 | `640d8b7` | Zwanzig Karten, Phasen, Fähren und Strömung; Grenzkorrektur im Folgecommit, Hafen/Dschungel visuell geprüft |
| M4 | `5373621` | Zwanzig Karten, Eis/Portale; sichere bewegliche Ankunft und Eisroute im Browser geprüft |
| M5 | `43abf18` | Routenvarianten und Lifecycle abgesichert; Hoch-/Querformat, Wischen, Touch-Buttons, Fokus und Vollbild geprüft |
| M6 | Abschließender Prüfstand | 138 Node-Tests, neun Python-Tests, Build/Check; alle 50 Karten mit drei Glühwürmchen und Rettung lösbar. Echte Geräte offen. |

Die aktuelle Zeichnung ist eine prozedurale Interpretation der Neon-Referenz. Menschliche Balanceprüfung, reale Geräte, mehrere Browser-Engines und Geräte-Performance sind noch offen. Details und Browsernachweise stehen im [Prüfstand](frogger.md#implementierungs--und-prüfstand). Keine neuen Abhängigkeiten; keine Veröffentlichung.

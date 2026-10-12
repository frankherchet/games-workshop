# Schneckenkampf – erste spielbare Version

## Spielidee und Gestaltung

Märchenhaftes Gartenspiel in Pixelgrafik aus der Vogelperspektive. Tagsüber Pflanzen pflegen, neue Samen kaufen, Beetflächen erweitern und Verteidigungen bauen. Nachts Schnecken mit einer Hacke in Blickrichtung bekämpfen. Die Hacke trifft ein nahes Ziel pro Schlag und hat einen sichtbaren Cooldown. Figuren: Gärtner, Gärtnerin, aufrechter Farmer-Fuchs, zunächst ohne unterschiedliche Fähigkeiten.

Die Gärten haben jeweils ein eigenes Terrain: Bauerngarten mit Apfelbäumen, Waldgarten mit Pilzen und Schlossgarten mit Steinwegen und alten Mauern. Am Tag warme Farben und Schmetterlinge; nachts kaltes Licht, wandernder Nebel, Laternen und leuchtende Schneckenaugen. Menüs und Anzeigen verwenden Holz und Papier. Es gibt in dieser Version keine Audioeffekte.

## Gärten, Schwierigkeit und Speicherung

| Garten | Freischaltung | Start |
| --- | --- | --- |
| Bauerngarten | Sofort | 6 Sonnensterne, 6 Pflanzplätze |
| Waldgarten | 5 Nächte im Bauerngarten | Eigene Partie, stärkere Schnecken |
| Schlossgarten | 10 Nächte im Waldgarten | Eigene Partie, stärkste Startwellen |

Nach Erreichen der Schwelle wird der nächste Garten dauerhaft freigeschaltet. Die Partie im bisherigen Garten läuft auf Wunsch weiter. Jeder Garten und Schwierigkeitsgrad hat einen eigenen Spielstand; Bestwerte und Freischaltungen gelten gemeinsam für die lokale Kampagne. Neue Partien ersetzen nur den gewählten Spielstand. Geld und Ausrüstung gehören jeweils zur Partie des Gartens.

- **Leicht:** Preise 80 %, Schneckenmenge 80 %, Bewegung der Schnecken 85 %, 90 Startmünzen, Hacken-Cooldown 0,9 Sekunden.
- **Mittel:** Normale Preise und Wellen, 70 Startmünzen, Hacken-Cooldown 1,1 Sekunden.
- **Schwer:** Preise 115 %, Schneckenmenge 120 %, Bewegung 110 %, 65 Startmünzen, Hacken-Cooldown 1,25 Sekunden. Zusätzlich höchstens `6 + floor(überlebte Nächte / 2)` gefressene Pflanzen insgesamt. Überschreiten beendet die Partie. Verwelkte Pflanzen zählen nicht als gefressen.

Ein Tag dauert 180 aktive Spielsekunden: morgens, mittags, abends je 60 Sekunden. Die Nacht kann früh gestartet werden. Sie endet erst, wenn alle Schnecken der Welle erschienen und besiegt sind. Shop, Pausen und Zusammenfassungen halten die Zeit an.

Automatische Speicherung spätestens alle zwei aktiven Sekunden, nach Käufen, Gartenaktionen und Phasenwechseln sowie beim Verlassen. Gespeichert werden auch laufende Wellen, Lebenspunkte, Ladungen und Cooldowns. Verwendet wird ausschließlich LocalStorage unter `cs-games:schneckenkampf:v1`; keine Übertragung zum Server. Browserwechsel, anderes Gerät oder gelöschte Browserdaten haben keinen Zugriff auf diese Spielstände. Bei gesperrtem Speicher erscheint ein Hinweis. Ungültige Daten werden verworfen.

## Pflanzen und Einkommen

| Samen | Grundpreis | Einkommen pro Nacht | Lebenspunkte | Voraussetzung |
| --- | --- | --- | --- | --- |
| Sonnenstern | 5 | 2 | 3 | Sofort |
| Feentulpe | 14 | 5 | 4 | Sofort |
| Mondlilie | 30 | 10 | 5 | Waldgarten freigeschaltet |
| Kristallrose | 55 | 17 | 6 | Schlossgarten freigeschaltet |

Gegossene Pflanzen bringen beim Sonnenaufgang Einkommen. Gießen heilt Schäden; beim Einpflanzen werden Pflanzen gleich gegossen. Nach einer trockenen Nacht gibt es keinen Ertrag, nach der zweiten aufeinanderfolgenden trockenen Nacht verwelkt die Pflanze. Gehen alle Pflanzen verloren, endet die Partie.

Der Garten lässt sich zweimal um je drei Pflanzplätze erweitern, für Grundpreise 55 und 85. Die neuen Plätze bleiben zunächst leer und brauchen Samen. Alle Preise werden an den Schwierigkeitsgrad angepasst.

## Shop und Verteidigung

| Gegenstand | Grundpreis | Verhalten |
| --- | --- | --- |
| Fanggrube | 12 | 3 Fänge; maximal 3 Nächte |
| Bierfalle | 18 | Lockt Schnecken im Nahbereich an; 4 Fänge; maximal 3 Nächte |
| Holzzaun | 14 | Stoppt nahe Schnecken, nimmt Schaden; für Grundpreis 5 reparierbar; maximal 5 Nächte ohne Reparatur |
| Elektrozaun | 35 | 5 sofortige Tötungen; maximal 4 Nächte |
| Kupferband | 16 | Reduziert die Geschwindigkeit im Umkreis auf 35 %; maximal 4 Nächte |
| Laufente | 48 | Greift alle 1,2 Sekunden nahe Schnecken an, wenn gefüttert |
| Futter | 4 | Eine Portion pro Ente und Nacht, beim Nachtstart automatisch verbraucht |

Hackenschaden bis Stufe 4 ausbaubar; Cooldown mit bis zu vier Verbesserungen um jeweils 0,18 Sekunden verkürzbar. Für Einkäufe muss die Figur nahe dem Stand stehen. Fallen werden aus dem Inventar auf freien Wegen nahe der Figur platziert, nicht auf Pflanzen oder vorhandene Verteidigung.

## Schnecken und Steuerung

Normale Schnecken, schnelle Schnecken, Panzerschnecken und große Vielfraße werden mit Fortschritt freigeschaltet. Vielfraße beschädigen mehrere benachbarte Pflanzen. Lebenspunkte steigen mit Nacht und Garten. Belohnung pro besiegter Schnecke: 2 bis 6 Münzen nach Art.

Touch-Joystick links, Aktion rechts. Nachts darf der Hackenbutton gehalten werden; der Cooldown gilt für jeden Schlag. Auf Computer zusätzlich WASD/Pfeiltasten, Leertaste für Aktion, E für Stand, N für Nacht und Escape für Pause. Tagsüber Pflanzen und freie Plätze in Reichweite antippen. Nachts lässt sich durch Antippen die Blickrichtung setzen. Ein Modus für Vollbild erweitert die Spielansicht ohne externe Dienste.

## Architektur und Prüfstand

`snail-model.js` enthält die testbare Spiellogik, `snail-art.js` zeichnet die Pixelwelt, `snail-game.js` verwaltet Menüs, Input und Speicher, `snail-style.css` die Oberfläche. Das Spiel ist im zentralen Katalog mit Kategorie Strategie und eigener Vorschau integriert. Der Build bleibt eine eigenständige HTML-Datei ohne Laufzeitabhängigkeiten. `dist/schneckenkampf.html` startet für die lokale Vorschau direkt das neue Spiel.

Automatische Tests prüfen unter anderem Gießen, Verwelken, Wirtschaft, Erweiterungen, Gartenfreischaltung, Speicherstände laufender Nächte, Gegner, Hackenschläge, Zäune, Fallen, Enten und Verlustbedingungen. Die Canvas-Grafik wurde separat gerendert und visuell geprüft. Eine echte Browser- und iPad-Prüfung des neuen Spiels steht noch aus; die erste Version ist deshalb zur Prüfung vorbereitet, nicht öffentlich veröffentlicht. Die Preis- und Wellenbalance ist ein erster Ansatz und soll anhand echter Spielrunden weiter abgestimmt werden.

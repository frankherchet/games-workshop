# Schneckenkampf – erste spielbare Version

## Spielidee und Gestaltung

Märchenhaftes Gartenspiel in Pixelgrafik aus der Vogelperspektive. Tagsüber Pflanzen pflegen, neue Samen kaufen, Beetflächen erweitern und Verteidigungen bauen. Nachts Schnecken mit einer Hacke in Blickrichtung bekämpfen. Die Hacke trifft ein nahes Ziel pro Schlag und hat einen sichtbaren Cooldown. Figuren: Gärtner, Gärtnerin, aufrechter Farmer-Fuchs, zunächst ohne unterschiedliche Fähigkeiten.

Die Gärten haben jeweils ein eigenes Terrain: Bauerngarten mit Apfelbäumen, Waldgarten mit Pilzen und Schlossgarten mit Steinwegen und alten Mauern. Am Tag warme Farben und Schmetterlinge; nachts kaltes Licht, wandernder Nebel, Laternen und leuchtende Schneckenaugen. Menüs und Anzeigen verwenden Holz und Papier. Es gibt in dieser Version keine Audioeffekte.

Die überarbeitete Grafik ergänzt mehrere Farbstufen, gerundete Pixel-Baumkronen, windbewegte Blätter, unterschiedlich geformte Blüten, Gras- und Bodentexturen, Holzmaserung, Saatkörbe und Wasserringe. Figuren bewegen Beine und Arme beim Laufen; der Fuchsschwanz schwingt mit. Schnecken kriechen mit beweglichen Fühlern und haben eigene Panzer- und Vielfraß-Designs. Gießen und Hackenschläge erhalten Werkzeuganimationen. Laternen und seltene Blumen leuchten nachts, Nebel zieht weich durch die Szene. Bei reduzierter Bewegung im Betriebssystem werden die dekorativen Animationen angehalten. Der statische Boden wird pro Garten zwischengespeichert, um die Renderarbeit zu reduzieren.

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

Der Garten lässt sich sechsmal um je drei Pflanzplätze auf insgesamt 24 Plätze erweitern, für Grundpreise 55, 70, 85, 100, 115 und 130. Die neuen Plätze bleiben zunächst leer und brauchen Samen. Alle Preise werden an den Schwierigkeitsgrad angepasst.

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

`snail-model.js` enthält die testbare Spiellogik, `snail-art.js` zeichnet die Pixelwelt, `snail-game.js` verwaltet Menüs, Input und Speicher, `snail-style.css` die Oberfläche. Das Spiel ist im zentralen Katalog mit Kategorie Strategie und eigener Vorschau integriert. Die Plattform lädt die feine Landschaftsgrafik erst beim Öffnen von Schneckenkampf aus `assets/`. Figuren, Pflanzen, Gegner und Effekte werden darüber dynamisch gezeichnet. Die Spielfläche zeichnet mit doppelter Auflösung; Menüs und Anzeigen verwenden Holz, Pergament, Gold und Waldgrün. `snail-refined.css` ergänzt die märchenhafte Oberfläche. Die Vorschau enthält die PNG eingebettet; die Produktionsseite verwendet eine separate Bilddatei mit Inhalts-Hash. `dist/schneckenkampf.html` startet für die lokale Vorschau direkt das neue Spiel.

Automatische Tests prüfen unter anderem Gießen, Verwelken, Wirtschaft, Erweiterungen, Gartenfreischaltung, Speicherstände laufender Nächte, Gegner, Hackenschläge, Zäune, Fallen, Enten und Verlustbedingungen. Die Canvas-Grafik wurde separat gerendert und visuell geprüft. Die Grafikversion V0.3 und ihr Vollbildmodus sind öffentlich veröffentlicht und im Cloud-Browser geprüft. Die danach ergänzten Shop-Kategorien, kompakten Beete und Münzeffekte sind noch nicht veröffentlicht; eine echte iPad-Prüfung steht aus. Die Preis- und Wellenbalance ist ein erster Ansatz und soll anhand echter Spielrunden weiter abgestimmt werden.

## Kompakte Beete, Shop und Erträge

24 Plätze in sechs Spalten und vier Reihen, Abstand 52 statt 80 Spielpixel. Sechs Pflanzen zu Beginn; Erweiterungen öffnen jeweils drei Plätze (55 Münzen, danach pro Erweiterung 15 Münzen mehr, vor Schwierigkeitsfaktor). Pflanzen stehen in kleinen, unregelmäßigen Erdvertiefungen mit Grashalmen an den Rändern. Alte Spielstände mit 12 Plätzen werden automatisch übernommen: Pflanzen, HP, Gießzustand, Geld, Nächte und Freischaltungen bleiben erhalten; die Beetpositionen wechseln in das kompakte Raster.

Die Shop-Leiste bietet Waffen (Hackenschaden und Cooldown), Pflanzen (Samen und Gartenfläche) und Fallen/Verteidigung (Fallen, Zäune, Kupferband, Enten und Futter). Die aktive Kategorie bleibt beim Kauf erhalten.

Schneckenprämien und Erträge gegossener Pflanzen erzeugen jeweils eine aufsteigende, drehende Münze mit +Betrag. Die Animation verblasst nach 1,35 Sekunden; bei reduzierter Bewegung bleibt sie an Ort und Stelle. Gespeicherte Partien spielen vergangene Ertragsanimationen nicht erneut ab.

## Figuren und Schnecken V0.4

Das transparente Sprite-Blatt `src/assets/garden-sprites-v4.png` ist mit der integrierten Bildgenerierung nach der beigefügten Referenz erstellt. Prompt: feine mittelalterliche Pixelkunst mit Gärtner, Gärtnerin und Farmer-Fuchs; vier Blickrichtungen, je Ruhepose und zwei Laufphasen; vier Schneckenformen mit je drei Kriechphasen. Die 48 Einzelbilder sind über gemessene Transparenzgrenzen zugeschnitten, nicht über ein angenommenes gleichmäßiges Raster. Das optionale Autorentool `scripts/inspect-snail-atlas.cjs` benötigt @napi-rs/canvas; Produktion, Build und CI benötigen dieses Paket nicht.

`snail-sprites.js` lädt das Blatt erst im Spiel, wählt Blickrichtung und Animationsphase und übernimmt es auch für die Figurenauswahl. Bei fehlender Bilddatei bleibt der frühere Canvas-Zeichenstil als Rückfall erhalten. Die schnelle Schnecke erscheint als Nacktschnecke; normale, gepanzerte und riesige Schnecken haben unterschiedliche Gehäuse und Augen. Die Gegnerwerte bleiben erhalten. Die Produktionsseite lädt Garten und Sprite-Blatt als separat gehostete Dateien mit Inhalts-Hash; die eigenständige Vorschau enthält beide eingebettet.

## Interaktion und bildschirmfüllende Kamera V0.5

Am Tag zeigt eine Pflanze im Umkreis von 96 Spielpixeln eine antippbare Gießkanne. Pflanzen mit Wasserbedarf haben Vorrang; gegossene Pflanzen erhalten eine Bestätigung. Der Klick gießt die konkrete Pflanze unabhängig vom aktuell ausgewählten Werkzeug. Am Stand erscheint innerhalb desselben 140-Pixel-Radius wie beim normalen Shop ein Knopf zum direkten Öffnen. Hinweise sind in Pausen, nachts und nach Spielende verborgen.

Der goldene Vollbildknopf liegt oben rechts über der Karte. Beim Spielstart scrollt die Seite an den Anfang der Spielfläche. Im Vollbild füllt die Karte den gesamten verfügbaren Browserbereich, HUD und Steuerung liegen darüber. Eine Kamera folgt der Figur und begrenzt den Ausschnitt an den Gartenrändern; dadurch bleibt die Grafik auch auf Hochkantbildschirmen unverzerrt. Touchpositionen und Hinweisknöpfe verwenden dieselbe Kameratransformation. Native Fullscreen-API wird weiterhin verwendet, wo verfügbar; ansonsten füllt das Spiel das Browserfenster. Browser-eigene Safari-Bedienelemente lassen sich aus diesem Fallback nicht entfernen.

59 automatische Tests bestehen lokal, darunter Kameraabdeckung, Touchkoordinaten nach Drehen, Hinweisauswahl und Shopradius. Die neue Oberfläche ist zur Freigabe vorbereitet; ein echter iPad-Test dieser Anpassungen steht aus.

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

Der Garten lässt sich fünfmal um je drei Pflanzplätze auf insgesamt 24 Plätze erweitern, für Grundpreise 55, 70, 85, 100 und 115. Die neuen Plätze bleiben zunächst leer und brauchen Samen. Alle Preise werden an den Schwierigkeitsgrad angepasst.

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

24 Plätze in sechs Spalten und vier Reihen, Abstand 52 statt 80 Spielpixel. Sechs Pflanzen und drei leere, offene Beete zu Beginn; Erweiterungen öffnen jeweils drei Plätze (55 Münzen, danach pro Erweiterung 15 Münzen mehr, vor Schwierigkeitsfaktor). Pflanzen stehen in kleinen, unregelmäßigen Erdvertiefungen mit Grashalmen an den Rändern. Alte Spielstände mit 12 Plätzen werden automatisch übernommen: Pflanzen, HP, Gießzustand, Geld, Nächte und Freischaltungen bleiben erhalten; die Beetpositionen wechseln in das kompakte Raster.

Die Shop-Leiste bietet Waffen (Hackenschaden und Cooldown), Pflanzen (Samen und Gartenfläche) und Fallen/Verteidigung (Fallen, Zäune, Kupferband, Enten und Futter). Die aktive Kategorie bleibt beim Kauf erhalten.

Schneckenprämien und Erträge gegossener Pflanzen erzeugen jeweils eine aufsteigende, drehende Münze mit +Betrag. Die Animation verblasst nach 1,35 Sekunden; bei reduzierter Bewegung bleibt sie an Ort und Stelle. Gespeicherte Partien spielen vergangene Ertragsanimationen nicht erneut ab.

## Figuren und Schnecken V0.4

Das transparente Sprite-Blatt `src/assets/garden-sprites-v4.png` ist mit der integrierten Bildgenerierung nach der beigefügten Referenz erstellt. Prompt: feine mittelalterliche Pixelkunst mit Gärtner, Gärtnerin und Farmer-Fuchs; vier Blickrichtungen, je Ruhepose und zwei Laufphasen; vier Schneckenformen mit je drei Kriechphasen. Die 48 Einzelbilder sind über gemessene Transparenzgrenzen zugeschnitten, nicht über ein angenommenes gleichmäßiges Raster. Das optionale Autorentool `scripts/inspect-snail-atlas.cjs` benötigt @napi-rs/canvas; Produktion, Build und CI benötigen dieses Paket nicht.

`snail-sprites.js` lädt das Blatt erst im Spiel, wählt Blickrichtung und Animationsphase und übernimmt es auch für die Figurenauswahl. Bei fehlender Bilddatei bleibt der frühere Canvas-Zeichenstil als Rückfall erhalten. Die schnelle Schnecke erscheint als Nacktschnecke; normale, gepanzerte und riesige Schnecken haben unterschiedliche Gehäuse und Augen. Die Gegnerwerte bleiben erhalten. Die Produktionsseite lädt Garten und Sprite-Blatt als separat gehostete Dateien mit Inhalts-Hash; die eigenständige Vorschau enthält beide eingebettet.

## Interaktion und bildschirmfüllende Kamera V0.5

Am Tag zeigt eine Pflanze im Umkreis von 96 Spielpixeln eine antippbare Gießkanne. Pflanzen mit Wasserbedarf haben Vorrang; gegossene Pflanzen erhalten eine Bestätigung. Der Klick gießt die konkrete Pflanze unabhängig vom aktuell ausgewählten Werkzeug. Am Stand erscheint innerhalb desselben 140-Pixel-Radius wie beim normalen Shop ein Knopf zum direkten Öffnen. Hinweise sind in Pausen, nachts und nach Spielende verborgen.

Der goldene Vollbildknopf liegt oben rechts über der Karte. Beim Spielstart scrollt die Seite an den Anfang der Spielfläche. Im Vollbild füllt die Karte den gesamten verfügbaren Browserbereich, HUD und Steuerung liegen darüber. Eine Kamera folgt der Figur und begrenzt den Ausschnitt an den Gartenrändern; dadurch bleibt die Grafik auch auf Hochkantbildschirmen unverzerrt. Touchpositionen und Hinweisknöpfe verwenden dieselbe Kameratransformation. Native Fullscreen-API wird weiterhin verwendet, wo verfügbar; ansonsten füllt das Spiel das Browserfenster. Browser-eigene Safari-Bedienelemente lassen sich aus diesem Fallback nicht entfernen.

59 automatische Tests bestehen lokal, darunter Kameraabdeckung, Touchkoordinaten nach Drehen, Hinweisauswahl und Shopradius. Die neue Oberfläche ist zur Freigabe vorbereitet; ein echter iPad-Test dieser Anpassungen steht aus.

## Pflanzen und Verteidigungen V0.6

Drei leere Startbeete stehen ohne Erweiterung zur Verfügung; vorhandene Spielstände erhalten diese Plätze kostenlos, soweit sie nicht von einer Verteidigung belegt sind. Geld, Pflanzen, Inventar und Gegner bleiben erhalten. Beim Pflanzen wird ausschließlich ein freies, offenes Beet bepflanzt. Belegte, gesperrte und entfernte Plätze erklären den jeweiligen Grund. Im Pflanzenmodus erscheint ein direkter Pflanzknopf über dem nächsten erreichbaren freien Beet.

Hinweisknöpfe werden mit ihren gemessenen Abmessungen und den belegten Flächen von Vollbildknopf, HUD, Hinweistext und Steuerung platziert. Der Shop-Hinweis weicht dem Vollbildknopf aus.

Das neue transparente Sprite-Blatt `src/assets/garden-defenses-v6.png` ist mit integrierter Bildgenerierung erstellt. Prompt: mittelalterliche feine Pixelkunst passend zum Garten, sechs Objekte (Erdgrube, Bierfass, Holzzaun, Elektrozaun mit magischen Kristallen, Kupferband, Laufente), je intakte und verbrauchte Variante beziehungsweise zwei Enten-Laufphasen. Die Bilder werden im Garten und als Shop-Vorschau verwendet. Verschleiß, Ladungen, Reparaturen und Futterverbrauch behalten ihre Spielregeln.

## Neue Waffen und Fallen V0.7

Im Waffen-Shop lassen sich Gartenrechen (48 Münzen, zwei Ziele, Reichweite 92, Cooldown-Faktor 1,4), Eichenkeule (72 Münzen, +2 Schaden, Reichweite 66, Faktor 1,6) und Dornen-Sichel (90 Münzen, ein Ziel, Reichweite 72, Faktor 0,75) erwerben und anlegen. Bereits gekaufte Waffen können kostenlos erneut ausgerüstet werden; die Hacke bleibt immer verfügbar. Schlagkraft und Geschicklichkeit verbessern alle Waffen. Käufe und Ausrüstungswechsel sind nur am Tag möglich.

Dornenfalle (24 Münzen): sechs einzelne Verletzungen, eigener Cooldown, vier Nächte. Harztopf (26 Münzen): reduziert Bewegung im Umkreis auf 20 Prozent, drei Nächte. Köderlaterne (32 Münzen): lockt Schnecken aus bis zu 170 Pixeln Entfernung an und fängt drei, drei Nächte. Keine mehrfachen Prämien für dieselbe Schnecke.

`src/assets/garden-extras-v7.png` enthält die sechs neuen Objekte. Bildgenerierungs-Prompt: detaillierte mittelalterliche Pixelkunst passend zum vorhandenen Garten, Rechen, Eichenkeule, Sichel, Dornenfalle, Harztopf, Köderlaterne auf transparentem Hintergrund. Ein anschließender Cutout-Auftrag bewahrt die Objekte und entfernt den Hintergrund. Waffen werden in der Hand und beim Angriff gezeichnet, Fallen im Garten sowie alle neuen Gegenstände als Shop-Vorschauen. Alte Speicherstände erhalten neue Inventarfelder und behalten Geld, Pflanzen, Waffenbesitz und Verteidigungen.

Die Laufente verfolgt nachts gefüttert die nächste lebende Schnecke mit 90 Pixeln pro Sekunde und pickt erst aus höchstens 24 Pixeln Entfernung. Ohne Ziel kehrt sie zu ihrem Aufstellort zurück. Am Tag spaziert sie in dessen Umgebung; ohne Futter verfolgt und verletzt sie nachts keine Gegner. Laufrichtung und zwei Laufbilder folgen der tatsächlichen Bewegung. Aufstellort und Jagd-Cooldown werden mitgespeichert.


### V0.8 · Laufenten füttern und Fallen umstellen

Bei einer Laufente in Reichweite erscheint „Füttern“. Eine Portion aus dem Futtervorrat gilt für eine Nacht. Tagsüber gefütterte Enten sind für die kommende Nacht versorgt; beim Nachtstart wird dafür kein zweites Futter abgezogen. Bereits versorgte Enten zeigen „Gefüttert ✓“. Auch nachts können hungrige Enten gefüttert werden und die Jagd aufnehmen. Ohne Vorrat erklärt ein Hinweis den Einkauf am Stand. Die automatische Versorgung ungefütterter Enten beim Nachtstart bleibt erhalten.

Bei nahen Fallen und stationären Verteidigungen erscheint tagsüber „Umstellen“. Danach einen freien Platz in Reichweite antippen oder „Abstellen“ für den Platz vor der Figur nutzen. Die alte Position bleibt bis zu einer gültigen Auswahl erhalten. „Abbrechen“ beendet die Auswahl ohne Änderung. Zustand, Ladungen, Alter, Objektidentität, Geld und Vorräte bleiben unverändert; die neue Position wird automatisch gespeichert. Nachts ist Umstellen gesperrt. Kontextbuttons berücksichtigen die Bedienelemente und bereits platzierte Hinweise bei ihrer Positionierung.

### V0.9 · Schwarze Gartenkatze

Alle zehn Sekunden aktiver Spielzeit besucht genau eine schwarze Pixelkatze eine freie Stelle im Garten. Sie sitzt drei Sekunden, läuft vier Sekunden einen kurzen freien Weg und setzt sich wieder hin. Mit dem nächsten Zehn-Sekunden-Abschnitt wechselt sie den Ort. Beete und Verteidigungen werden bei der Wegwahl berücksichtigt. Sie greift nicht ins Spielgeschehen ein und verändert weder Ressourcen noch gespeicherte Daten. Pause und Shop halten ihren Besuchstimer an; beim Fortsetzen einer Partie beginnt er neu. Bei reduzierter Bewegung sitzt sie ruhig. In einem vollständig belegten Garten entfällt der Besuch, bis wieder Platz ist.

### V0.9.1 · Katzenbesuch sichtbar ab Spielstart

Die Katze ist ab dem Betreten oder Fortsetzen sichtbar. Ihr Zehn-Sekunden-Timer verwendet echte aktive Zeit statt des auf 50 ms je Bild begrenzten Simulationsschritts. Pause und Shop bleiben ausgenommen. Neue Besucherpositionen werden bevorzugt in der Nähe der Figur gesucht; der Bezugspunkt bleibt während eines Besuchs stabil, damit die Katze beim Laufen der Figur nicht springt. Freie Wege, unveränderte Ressourcen und der bestehende Spielstand bleiben erhalten.

### V0.10 · Natürliches Katzenleben

Die Katze behält während einer Partie ihre Position und läuft mit 24 Garteneinheiten pro Sekunde auf freien Wegen. Sie wird nicht mehr alle zehn Sekunden neu platziert. Sitzpausen, spielerisches Pföteln und kleine Hüpfer, Fellpflege und 22–40 Sekunden lange Liegepausen wechseln sich ab. Beim Schlafen sind ihre Augen geschlossen und der Körper bewegt sich leicht mit der Atmung. Neue Hindernisse stoppen die Katze, statt sie zu versetzen. Sie bleibt rein dekorativ, pausiert mit dem Spiel und wird beim Fortsetzen neu initialisiert. Bestehende Spielstände und die Spielbalance bleiben erhalten. Diese Version ersetzt das frühere Zehn-Sekunden-Besuchsverhalten.

### V0.11 · Katzenzeichnung und Animationen

Feine Fellpixel, runde Pfoten, dreieckige Ohren, Schnurrhaare und eine bewegliche Schwanzspitze passen die Katze an den detaillierten Garten an. Vier abwechselnde Pfoten und dezentes Kopfnicken begleiten das Laufen. Ein 0,65 Sekunden langer weicher Haltungswechsel verbindet Sitzen, Laufen und Hinlegen; Schlafen zeigt geschlossene Augen und ruhige Atmung. Beim Spielen streckt die Katze die Pfote aus und hüpft leicht, bei der Fellpflege schließt sie die Augen und leckt ihre Pfote. Tageslicht wirkt wärmer, Mondlicht blaugrau mit zurückhaltendem Augenglanz. Reduzierte Bewegung bleibt berücksichtigt.

### V0.12 · Gezeichnete Katze und zufällige Schneckenbosse

Die Katze nutzt nun `src/assets/garden-cat-v12.png` mit 20 freigestellten Einzelbildern für Sitzen, Laufen, Spielen, Putzen und Schlafen. Das bestehende kontinuierliche Bewegungsverhalten bleibt erhalten; bei Bildfehlern bleibt die Canvas-Zeichnung als Ersatz verfügbar. Die Bilddatei wurde mit dem eingebauten ImageGen-Werkzeug erstellt, mit Garten und Figurenatlas als Stilreferenzen. Erstellungsauftrag: „Detailed tiny-pixel hand-painted medieval fairy-tale black cat, compact natural proportions, charcoal fur, warm reflected rim light, subtle green eyes, transparent 4 × 5 atlas; four frames each for sitting, walking, paw-swat play, grooming and curled-up sleeping; no background or text.“ Gemessene Ausschnitte stehen in `snail-cat-layout.json` und im Renderer.

Jede fünfte Nacht (5, 10, 15 …) enthält am Ende genau einen zusätzlichen Boss. Sein Design wird gleichverteilt aus 14 Varianten gewählt und im Spielstand gespeichert. Die Dateien IMG_0939 bis IMG_0952 dienten als Vorlagen für das neue Atlasbild `src/assets/garden-bosses-v12.png`. Sechs Nacktschnecken und acht Gehäuseschnecken behalten ihre Lava-, Sturm-, Wald-, Kosmos-, Gift-, Kristall- beziehungsweise Inferno-Merkmale. Der Atlas wurde mit dem eingebauten ImageGen-Werkzeug als transparente Spielgrafik erstellt. Erstellungsauftrag: „Fourteen isolated fine painted-pixel boss creatures in 4 × 4 atlas, final two cells empty; first six shell-less lava, storm, forest, cosmic, swamp and crystal slugs; then forest, crystal, infernal royal, cosmic, volcanic, storm, necromantic plague and toxic swamp spiral-shell snails; preserve reference materials and ornaments, slightly top-down right-facing view; no screenshot UI, scene or text.“ Anschließende Korrekturen entfernten ungewollte Gehäuse bei den Nacktschnecken und schufen transparente Abstände zwischen allen Figuren. Gemessene Ausschnitte stehen in `snail-boss-layout.json` und im Renderer.

Die Stärke ist vom Design unabhängig. Bossstufe = Nacht / 5; auf Mittel hat der erste Boss 12 KP, jeder weitere 9 KP mehr, zuzüglich 4 KP je Gartenstufe. Leicht multipliziert KP mit 0,8, Schwer mit 1,2 (aufgerundet). Bissschaden = 2 + abgerundete halbe Bossstufe. Prämie = 10 + 3 × Bossstufe. Der Boss ist 140 Garteneinheiten breit gegenüber 56 bei normalen Schnecken. Fänge durch Gruben verursachen 3, Elektrozäune 4, Bierfallen und Laternen 2 Schaden je Ladung mit 0,9 Sekunden Abstand. Normale Schnecken behalten das bisherige Fallenverhalten.

Bossname, Stufe und KP-Leiste erscheinen über dem Spielfeld; im Vollbild bleiben sie am oberen Bildschirmrand. Jeder Boss besitzt passend zu seinem Design einen Spezialangriff: Lavakugel, Blitzschlag, Dornenranken, Sternenfall, Gifttümpel, Kristallsplitter oder Flammenrune. Eine 1,8 Sekunden sichtbare Zielmarkierung warnt vor dem Einschlag auf einem Beet. Einschläge verursachen unabhängig vom Design 1 + abgerundete Bossstufe / 3 Schaden an Pflanzen im Radius 42 und den fünffachen Wert an stationärer Verteidigung. Nach dem ersten Angriff nach 8 Sekunden beträgt die Pause max(7, 13 − 0,35 × Stufe) Sekunden. Tod des Bosses bricht vorbereitete Angriffe ab. Warnungen, zufälliges Aussehen, KP und Cooldowns bleiben beim Fortsetzen erhalten; alte Spielstände erhalten leere Angriffsdaten.

Die Angriffsmuster unterscheiden sich auch mechanisch: Lava trifft eine Explosionsfläche (Radius 55), Sturm drei Stellen in einer Reihe (Radius 19), Wald eine 3,5 Sekunden bestehende Wurzelfläche (Radius 55, Laufgeschwindigkeit darin 55 %). Gift verursacht im Radius 42 drei kleine Schadenstakte über zwei Sekunden. Kristall trifft einen Fächer aus drei nacheinander einschlagenden Splittern. Kosmos kündigt 2,8 Sekunden lang einen großen Einschlag im Radius 65 an. Inferno markiert fünf Felder in Kreuzform. Die gemeinsame Schadensbasis bleibt stufenabhängig und die Grundwerte KP, Biss und Prämie bleiben bei allen Designs derselben Stufe identisch. Die Muster ersetzen die oben beschriebene einheitliche Flächenattacke.

# ADR-20260716-native-async-api

## Kontext

Die bisherige API öffnet und liest PST-Dateien synchron. Datei-I/O blockiert dadurch den Node.js Event Loop; außerdem war die Named-Property-Map global über alle geöffneten Dateien geteilt. Version 2 soll eine abbrechbare API für Server- und Batch-Anwendungen ergänzen, ohne die synchrone Objektfamilie zu entfernen.

## Problemdefinition

Zu entscheiden ist, ob asynchrones PST-Lesen als native Promise-/Random-Access-API, als Worker-Thread-Fassade oder als ausschließlich asynchrone neue Haupt-API umgesetzt wird. Die Entscheidung umfasst Runtime-Basis, Ownership, Traversierung und Kompatibilität.

## Kriterienkatalog

- Event-Loop-Verhalten und Backpressure
- Migrationsaufwand für bestehende Nutzer
- Implementierungs- und Betriebsaufwand
- Erweiterbarkeit für benutzerdefinierte Datenquellen
- Fehler-, Abbruch- und Ressourcenmodell

## Top 3 Varianten

### 1) Native Async-I/O (gewählt)

Promise-basierte, positionsbezogene Reader bilden Pfade, FileHandles, Buffer und benutzerdefinierte Quellen einheitlich ab. Eine eigenständige Async-Objektfamilie bietet lazy Traversierung und Attachment-Streaming.

### 2) Worker-Thread-Fassade (nicht gewählt)

Der bestehende synchrone Parser läuft unverändert in Workern. Das isoliert CPU- und I/O-Blocking, verursacht aber Kopier-, Pool- und Deployment-Aufwand und erschwert benutzerdefinierte Reader.

### 3) Async-first mit Entfernung der Sync-API (nicht gewählt)

Alle Parserpfade und Objekte werden ersetzt. Das liefert langfristig die kleinste Oberfläche, erzwingt aber eine sofortige Migration aller Nutzer.

## Tabellarische Gegenüberstellung

| Kriterium                         | Gewicht | Native Async | Worker-Fassade | Async-first |
| --------------------------------- | ------: | -----------: | -------------: | ----------: |
| Event Loop / Backpressure         |    30 % |            5 |              4 |           5 |
| Migration                         |    25 % |            4 |              5 |           1 |
| Implementierungs-/Betriebsaufwand |    20 % |            4 |              2 |           1 |
| Datenquellen                      |    15 % |            5 |              2 |           5 |
| Lifecycle / Abbruch               |    10 % |            5 |              3 |           5 |

## Gewichtete Bewertung

Native Async erreicht 4,45/5, die Worker-Fassade 3,45/5 und Async-first 3,15/5. Native Async bietet das beste Verhältnis aus kontrollierbarer Migration, Datenquellenflexibilität und Laufzeitverhalten.

## Begründete Entscheidung

Version 2 ergänzt `AsyncPSTFile.open()` und eine eigenständige Async-Objektfamilie. Reader sind positionsbezogen und liefern exakte Bereiche. Pfad- und Buffer-Reader gehören der PST-Instanz; benutzerdefinierte Reader bleiben standardmäßig beim Aufrufer. `AbortSignal`, stabile Fehlercodes und idempotentes Schließen gelten über die gesamte neue Oberfläche.

Node.js 22 und pnpm werden verbindlich. Die Anhebung sowie die Korrektur der fälschlich statischen, dateispezifischen Named-Property-Map rechtfertigen Version 2.0.0. Die synchrone Objektfamilie bleibt verfügbar.

Worker Threads sind kein Bestandteil dieser Änderung. Benchmarks messen Durchsatz, Event-Loop-Delay und Speicher. Ein Worker-Pool wird nur als separates Vorhaben bewertet, wenn CPU-Parsing messbar blockiert.

## Konsequenzen

- Anwendungen können mehrere Dateien und unabhängige Ordneriteratoren sicher parallel verwenden.
- Attachment-Streaming ist der Standard; vollständiges Puffern wird über Limits begrenzt.
- Der kompatible `getNextChild()`-Cursor bleibt zustandsbehaftet und nicht parallel nutzbar.
- Die alten statischen Property-Map-Methoden entfallen zugunsten von `PSTFile`-Instanzmethoden.
- Bestehende Nutzer müssen auf Node.js 22 aktualisieren, können ihre synchrone Traversierung aber beibehalten.
- CPU-intensive Parserteile werden weiter beobachtet und anhand des Benchmarks bewertet.

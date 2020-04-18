# RIOD-Backend

## Setup
0. Node.js und npm installieren
1. Die [Firebase Console öffnen](https://console.firebase.google.com)
2. `riod bike` auswählen
3. Links oben aufs Zahnrad, Projekteinstellungen klicken
4. Unten bei `Firebase SDK snippet` `Konfiguration` wählen
5. Code Snippet mit vorangestelltem `export` in `src/environment.ts` schreiben, also

    `export const firebaseConfig = { apiKey: [...]`
6. `npm install` ausführen (Installation von Dependencies)
7. Transpilieren mit `tsc`
8. Starten mit `node dist/server.js`

## Sonstiges

In `riod-bike-export.json` sind Demodaten mit Positionen. Die ersten 5 sind in einem Abstand von unter 5 Meter, der 6. ist knapp 30m entfernt.
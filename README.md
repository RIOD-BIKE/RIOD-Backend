# RIOD-Backend

This is the backend for RIOD. It's responsible for clustering the cyclists based on their location using DBSCAN and bearing stored in Cloud Firestore. It also determines which other Clusters and Assembly Points are visible to each cyclist. This repo also contains a Garbage Collector auto automatically remove outdated entries from Realtime Database.

## Setup
1. Install Node.js and npm
2. Open [Firebase Console öffnen](https://console.firebase.google.com)
3. Click `riod bike`
4. Click Settings, Project Settings, Service Accounts
5. Click `Generate New Private Key`, optional: remove old service accounts (if any) in GCP
6. Save the config and place it directory of your choice
7. Set enviroment variable `GOOGLE_APPLICATION_CREDENTIALS` to the keys path, e.g. `export GOOGLE_APPLICATION_CREDENTIALS=/Users/foo/bar/riod-bike-firebase-adminsdk-1337.json`
8. Run `npm install` to install dependencies
9. Transpile with `npx tsc`

## Run
Run server with `node dist/server.js` and run Garbage Collector with `node dist/garbageCollector.js` (ideally setup a cronjob)
import { exit } from 'process';
import * as admin from 'firebase-admin';

const firebase = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://riod-bike.firebaseio.com'
});
const realtimeDB = firebase.database().ref('assemblyPoints');
const currentTime = Math.floor(Date.now() / 1000);
const graceTime = 20;
const promises: Promise<any>[] = [];

// get data snapshot from Firestore
realtimeDB.once('value', snapshot => {
    // loop over all APs in snapshot
    snapshot.forEach(apSnapshot => {
        // loop over all nextAPs in an AP
        apSnapshot.forEach(nextAPSnapshot => {
            // loop over all cyclists in a nextAP
            nextAPSnapshot.forEach(cyclist => {
                if(cyclist.key === '__DUMMY__') return;
                const duration = cyclist.child('duration').val();
                const timestamp = cyclist.child('timestamp').val();
                // if the expected time (time the value has been written + expected duration + grace period)
                // is exceeded, remove the cyclist from the nextAP
                if (timestamp + duration + graceTime < currentTime) {
                    console.log(`${apSnapshot.key}/${nextAPSnapshot.key}/${cyclist.key} is ${Math.abs(timestamp + duration + graceTime - currentTime)} sec late! Removing...`);
                    promises.push(cyclist.ref.remove());
                }
            });
        });
    });
    // wait for all promises to settle
    Promise.all(promises).then(() => {
        exit(0);
    });
});
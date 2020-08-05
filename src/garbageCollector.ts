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

realtimeDB.once('value', snapshot => {
    snapshot.forEach(apSnapshot => {
        apSnapshot.forEach(nextAPSnapshot => {
            nextAPSnapshot.forEach(cyclist => {
                if(cyclist.key === '__DUMMY__') return;
                const duration = cyclist.child('duration').val();
                const timestamp = cyclist.child('timestamp').val();
                if (timestamp + duration + graceTime < currentTime) {
                    console.log(`${apSnapshot.key}/${nextAPSnapshot.key}/${cyclist.key} is ${Math.abs(timestamp + duration + graceTime - currentTime)} sec late! Removing...`);
                    promises.push(cyclist.ref.remove());
                }
            });
        });
    });
    Promise.all(promises).then(() => {
        exit(0);
    });
});
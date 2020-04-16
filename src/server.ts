import * as firebase from 'firebase/app';
import 'firebase/database'
import 'firebase/firestore'
import { firebaseConfig } from './environment';

firebase.initializeApp(firebaseConfig);

const realtimeDB = firebase.database().ref();
const firestoreDBUsers = firebase.firestore().collection('users');

// Fetch current locations from Realtime Database every 2 sec.
setInterval(async () => {
    const snapshot = await realtimeDB.once('value');
    runClustering(snapshot);
}, 2000);


function runClustering(snapshot: firebase.database.DataSnapshot) {
    console.log('clustering...');
    // const clusters = ... <-- Ausrechnen der Cluster
    // Fertige Clusterdaten, ggf. mit Positionen der Nutzer im Cluster (Datenschutz?)
    const clusters = {
        'cluster_1': {
            '00user_1': {
                'position': snapshot.child('user_1/position').val(),
                'direction': 7
            },
            '00user_2': {
                'position': [2, 0],
                'direction': 8
            }
        },
        'cluster_2': {
            '00user_3': {
                'position': [3, 0],
                'direction': 9
            }
        }
    };

    Object.entries(clusters).forEach(([clusterId, usersInCluster]) => {
        Object.entries(usersInCluster).forEach(([userId, userInfo]) => {
            console.log(`${clusterId}: ${userId} @ ${userInfo['position']} and direction ${userInfo['direction']}`);
            firestoreDBUsers.doc(userId).set({
                'cluster': {
                    'id': clusterId,
                    'size': Object.entries(usersInCluster).length
                }
            })
        })
    })
}
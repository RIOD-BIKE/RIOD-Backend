import * as firebase from 'firebase/app';
import 'firebase/database'
import 'firebase/firestore'
import { point, featureCollection } from '@turf/helpers';
import clustersDbscan from '@turf/clusters-dbscan';
import { firebaseConfig } from './environment';
import util from 'util';
import { DBSCAN } from './dbscan/dbscan';

firebase.initializeApp(firebaseConfig);
const realtimeDB = firebase.database().ref();
const firestoreDBUsers = firebase.firestore().collection('users');

// Fetch current locations from Realtime Database every 2 sec.
// setInterval(async () => {
//     const snapshot = await realtimeDB.once('value');
//     runClustering(snapshot);
// }, 2000);
realtimeDB.once('value').then(snapshot => runClustering(snapshot));

function runClustering(snapshot: firebase.database.DataSnapshot) {
    console.log('clustering...');

    // Rohe Positionsdaten in Point umwandeln und mit userId markieren
    let points: any = [];
    snapshot.forEach(user => {
        points.push(point(user.child('position').val().reverse()));
    });
    points = featureCollection(points);
    // Clustern: Beachtet keine Winkel, nur nach Position! Clustert nach max. Distanz von jedem zu jedem Punkt!
    const clustersDB = clustersDbscan(points, 5, {
        units: 'meters',
        minPoints: 3
    });
    const dbscan = new DBSCAN(points, 5, 3);
    console.log(util.inspect(dbscan.run(), false, null));
    // console.log(JSON.stringify(clustersDB));
    console.log(util.inspect(clustersDB, false, null));

    return;
    // TODO: cluster von dbscan.run() verarbeiten (in Firestore speichern)
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
import * as firebase from 'firebase/app';
import 'firebase/database'
import 'firebase/firestore'
import { point, featureCollection, FeatureCollection, Point } from '@turf/helpers';
import clustersDbscan from '@turf/clusters-dbscan';
import { firebaseConfig } from './environment';
import util from 'util';
import { DBSCAN, PointType } from './dbscan/dbscan';

firebase.initializeApp(firebaseConfig);
const realtimeDB = firebase.database().ref();
const firestoreDBUsers = firebase.firestore().collection('users');

// Fetch current locations from Realtime Database every 2 sec.
// setInterval(async () => {
//     const snapshot = await realtimeDB.once('value');
//     runClustering(snapshot);
// }, 2000);
realtimeDB.once('value').then(snapshot => runClustering(snapshot));

async function runClustering(snapshot: firebase.database.DataSnapshot) {
    console.log('clustering...');

    // Rohe Positionsdaten in Point umwandeln und mit userId markieren
    const points: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
    snapshot.forEach(user => {
        points.features.push(point(user.child('position').val().reverse(), {
            'userId': user.key,
            'direction': user.child('direction').val()
        }));
    });
    const dbscan = new DBSCAN(points, 5, 3);
    const clusters = dbscan.run();
    console.log(util.inspect(clusters, false, null));

    for (const feature of clusters.features) {
        const userId = feature.properties?.['userId'];
        if (feature.properties?.['dbscan'] === PointType.core) {
            const clusterId = feature.properties?.['cluster'];
            firestoreDBUsers.doc(userId).set({
                'cluster': {
                    'id': clusterId,
                    // 'size': Object.entries(usersInCluster).length
                }
            });
        } else {
            await firestoreDBUsers.doc(userId).update({
                'cluster': firebase.firestore.FieldValue.delete()
            }).catch(e => {
                console.error(`Error: Could not delete cluster for user ${userId}: ${e.code}!`);
            });
        }
    }
}
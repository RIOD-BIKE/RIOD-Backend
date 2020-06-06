import * as firebase from 'firebase/app';
import 'firebase/database'
import 'firebase/firestore'
import { point, featureCollection, FeatureCollection, Point } from '@turf/helpers';
import clustersDbscan from '@turf/clusters-dbscan';
import { firebaseConfig } from './environment';
import util from 'util';
import { DBSCAN, PointType } from './dbscan/dbscan';
import { strict } from 'assert';
import { distance } from 'geokdbush';

firebase.initializeApp(firebaseConfig);
const realtimeDB = firebase.database().ref();
const firestoreDBUsers = firebase.firestore().collection('users');
const firestoreDBClusters = firebase.firestore().collection('clusters');
const firestoreDBAssemblyPoints = firebase.firestore().collection('assemblypoints');

// Fetch current locations from Realtime Database every 2 sec.
// setInterval(async () => {
//     const snapshot = await realtimeDB.once('value');
//     runClustering(snapshot);
// }, 2000);
// fjykF6qGV9PQMYHJSb9BP5QwfsI2: 52.271876 8.037869

const assemblyPoints = new Map<String, { name: string, coordinates: [number, number] }>();
firestoreDBAssemblyPoints.get().then(snapshot => {
    snapshot.forEach(doc => {
        assemblyPoints.set(doc.id, doc.data() as { name: string, coordinates: [number, number] });
    });
    realtimeDB.once('value').then(snapshot => runClustering(snapshot));
});

async function runClustering(snapshot: firebase.database.DataSnapshot) {
    console.log('clustering...');

    const points: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
    const users = snapshot.child('users');
    users.forEach(user => {
        points.features.push(point([user.child('latitude').val(), user.child('longitude').val()], {
            'userId': user.key,
            'direction': user.child('bearing').val()
        }));
    });
    const dbscan = new DBSCAN(points, 5, 3);
    const cyclists = dbscan.run();
    const clusters = dbscan.getClusters();
    // console.log(util.inspect(cyclists, false, null));

    for (const [cIdx, c] of clusters) {
        await firestoreDBClusters.doc(cIdx.toString()).set({
            'coordinates': c.position,
            'count': c.size
        });
    }
    for (const cyclist of cyclists.features) {
        const userId = cyclist.properties?.['userId'];
        const activeCluster = (cyclist.properties?.['dbscan'] === PointType.core) ? firestoreDBClusters.doc(cyclist.properties?.['cluster'].toString()) : null;

        // Update nearby Clusters and Assembly Points (currently in 5 km radius)
        const nearbyClusters = [...clusters]
            .filter(([cIdx, c]) => distance(c.position[0], c.position[1], cyclist.geometry.coordinates[0], cyclist.geometry.coordinates[1]) < 5)
            .map(c => firestoreDBClusters.doc(c[0].toString()));
        const nearbyAssemblyPoints = [...assemblyPoints]
            .filter(([aIdx, a]) => distance(a.coordinates[0], a.coordinates[1], cyclist.geometry.coordinates[0], cyclist.geometry.coordinates[1]) < 5)
            .map(a => firestoreDBAssemblyPoints.doc(a[0].toString()));

        firestoreDBUsers.doc(userId).update({
            'activeCluster': activeCluster,
            'clusters': nearbyClusters,
            'assemblyPoints': nearbyAssemblyPoints
        });
    }
}
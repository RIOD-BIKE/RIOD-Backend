import { Cluster } from './models/Cluster';
import { FirestoreCache } from './FirestoreCache';
import * as firebase from 'firebase/app';
import 'firebase/database'
import 'firebase/firestore'
import { point, FeatureCollection, Point } from '@turf/helpers';
import { firebaseConfig } from './environment';
import util from 'util';
import { DBSCAN, PointType } from './dbscan/dbscan';
import { distance } from 'geokdbush';
import { User } from './models/User';

firebase.initializeApp(firebaseConfig);
const realtimeDB = firebase.database().ref();
const firestoreDBClusters = firebase.firestore().collection('clusters');
const firestoreDBAssemblyPoints = firebase.firestore().collection('assemblypoints');
const firestoreCache = new FirestoreCache();

const assemblyPoints = new Map<String, { name: string, coordinates: { latitude: number, longitude: number} }>();
// Fetch current locations from Realtime Database every 2 sec.
firestoreDBAssemblyPoints.get().then(snapshot => {
    snapshot.forEach(doc => {
        assemblyPoints.set(doc.id, doc.data() as { name: string, coordinates: { latitude: number, longitude: number} });
    });
    setInterval(() => {
        realtimeDB.once('value').then(snapshot => runClustering(snapshot));
    }, 2000);
});

async function runClustering(snapshot: firebase.database.DataSnapshot) {
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
    let writesCluster = 0;
    let writesUser = 0;

    // console.log(util.inspect(cyclists, false, null));

    for (const [cIdx, c] of clusters) {
        if(firestoreCache.writeCluster(c)) writesCluster++;
    }
    for (const cyclist of cyclists.features) {
        const userId = cyclist.properties?.['userId'] as string;
        const activeCluster = (cyclist.properties?.['dbscan'] === PointType.core) ? firestoreDBClusters.doc(cyclist.properties?.['cluster'].toString()) : null;

        // Update nearby Clusters and Assembly Points (currently in 5 km radius)
        const nearbyClusters = [...clusters]
            .filter(([cIdx, c]) => distance(c.position.latitude, c.position.longitude, cyclist.geometry.coordinates[0], cyclist.geometry.coordinates[1]) < 5)
            .map(c => firestoreDBClusters.doc(c[0].toString()));
        const nearbyAssemblyPoints = [...assemblyPoints]
            .filter(([aIdx, a]) => distance(a.coordinates.latitude, a.coordinates.longitude, cyclist.geometry.coordinates[0], cyclist.geometry.coordinates[1]) < 5)
            .map(a => firestoreDBAssemblyPoints.doc(a[0].toString()));

        const user = new User(userId, activeCluster, nearbyClusters, nearbyAssemblyPoints);
        if(firestoreCache.writeUser(user)) writesUser++;
    }
    printOutput(clusters, writesCluster, writesUser);
}

async function printOutput(clusters: Map<number, Cluster>, writesCluster: number, writesUser: number, ) {
    // TODO: replace console.log with logging-framework
    process.stdout.write('\x1Bc');
    console.log(`=== CLUSTERING ${ (new Date).toISOString() } ===`);
    for(const [idx, cluster] of clusters) {
        console.log(`C #${idx} @ [${cluster.position.latitude}, ${cluster.position.longitude}]: ${cluster.count} Cyclists`);
    }
    console.log(`wrote to ${writesCluster} Clusters and ${writesUser} Users`);
}
import { Cluster } from './models/Cluster';
import { User } from './models/User';
import Tree from 'splaytree';
import * as firebase from 'firebase-admin';

export class FirestoreCache {
    private users: Tree<string, User>;
    private clusters: Tree<string, Cluster>;
    private firestoreUsers = firebase.firestore().collection('users');
    private firestoreClusters = firebase.firestore().collection('clusters');

    constructor() {
        this.users = new Tree();
        this.clusters = new Tree();
    }

    public writeUser(newUser: User) {
        // TODO: First-run check?
        if (!this.users.contains(newUser.userId)) {
            this.users.add(newUser.userId, newUser);
            this.writeUserToFirestore(newUser);
            return true;
        }
        const oldUser = this.users.find(newUser.userId)!.data as User;
        if (oldUser.equals(newUser)) return false;
        this.writeUserToFirestore(newUser);
        this.users.remove(newUser.userId);
        this.users.add(newUser.userId, newUser);
        return true;
    }

    public writeCluster(newCluster: Cluster) {
        // TODO: First-run check?
        if (!this.clusters.contains(newCluster.clusterId)) {
            this.clusters.add(newCluster.clusterId, newCluster);
            this.writeClusterToFirestore(newCluster);
            return true;
        }
        const oldCluster = this.clusters.find(newCluster.clusterId)!.data as Cluster;
        if (oldCluster.equals(newCluster)) return false;
        this.writeClusterToFirestore(newCluster);
        this.clusters.remove(newCluster.clusterId);
        this.clusters.add(newCluster.clusterId, newCluster);
        return true;
    }


    private writeUserToFirestore(user: User) {
        // TODO: add await to prevent heap overflow?
        this.firestoreUsers.doc(user.userId).update({
            'activeCluster': user.activeCluster,
            'clusters': user.clusters,
            'assemblyPoints': user.assemblyPoints
        });
    }

    private writeClusterToFirestore(cluster: Cluster) {
        // TODO: add await to prevent heap overflow?
        this.firestoreClusters.doc(cluster.clusterId).set({
            'coordinates': cluster.position,
            'count': cluster.count
        });
    }
}
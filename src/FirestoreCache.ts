import { User } from './models/User';
import Tree from 'splaytree';
import firebase from 'firebase';

export class FirestoreCache {
    private users: Tree<string, User>;
    private firestoreDBUsers = firebase.firestore().collection('users');

    constructor() {
        this.users = new Tree();
    }

    public write(newUser: User) {
        if (!this.users.contains(newUser.userId)) {
            this.users.add(newUser.userId, newUser);
            this.writeToFirestore(newUser);
            return true;
        }
        const oldUser = this.users.find(newUser.userId)!.data as User;
        if (oldUser.equals(newUser)) return false;
        this.writeToFirestore(newUser);
        this.users.remove(newUser.userId);
        this.users.add(newUser.userId, newUser);
        return true;
    }

    private writeToFirestore(user: User) {
        // TODO: add await to prevent heap overflow?
        this.firestoreDBUsers.doc(user.userId).update({
            'activeCluster': user.activeCluster,
            'clusters': user.clusters,
            'assemblyPoints': user.assemblyPoints
        });
    }
}
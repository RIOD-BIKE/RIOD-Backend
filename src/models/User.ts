export class User {
    public userId: string;
    public activeCluster: firebase.firestore.DocumentReference | null;
    public clusters: firebase.firestore.DocumentReference[];
    public assemblyPoints: firebase.firestore.DocumentReference[];

    constructor(userId: string, activeCluster: firebase.firestore.DocumentReference | null,
        clusters: firebase.firestore.DocumentReference[], assemblyPoints: firebase.firestore.DocumentReference[]) {
        this.userId = userId;

        this.activeCluster = activeCluster;
        this.clusters = clusters;
        this.assemblyPoints = assemblyPoints;
    }

    public equals(otherUser: User) {
        const activeClusterEqual = this.activeCluster?.path === otherUser.activeCluster?.path;
        const clustersEqual = (this.clusters.length === 0 && otherUser.clusters.length === 0) ||
            (this.clusters.length === otherUser.clusters.length) && this.assemblyPoints.every((ref, idx) => ref.path === otherUser.assemblyPoints[idx]?.path);

        const assemblyPointsEqual = (this.clusters.length === 0 && otherUser.clusters.length === 0) ||
            (this.clusters.length === otherUser.clusters.length) && this.assemblyPoints.every((ref, idx) => ref.path === otherUser.assemblyPoints[idx]?.path);

        return activeClusterEqual && clustersEqual && assemblyPointsEqual;
    }
}
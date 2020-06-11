export class Cluster {
    clusterId: string;
    position: {
        latitude: number,
        longitude: number
    };
    count = 0;

    constructor(clusterId: string, position: { latitude: number, longitude: number }, size: number) {
        this.clusterId = clusterId;
        this.position = position;
        this.count = size;
    }

    public equals(otherCluster: Cluster) {
        return this.position.latitude === otherCluster.position.latitude
            && this.position.longitude === otherCluster.position.longitude
            && this.count === otherCluster.count;
    }
}
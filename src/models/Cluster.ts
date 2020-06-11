export class Cluster {
    clusterId: string;
    position: {
        latitude: number,
        longitude: number
    };
    size = 0;

    constructor(clusterId: string, position: { latitude: number, longitude: number }, size: number) {
        this.clusterId = clusterId;
        this.position = position;
        this.size = size;
    }
}
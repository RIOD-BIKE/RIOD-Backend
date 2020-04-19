import { FeatureCollection, Point, featureCollection, Feature } from '@turf/helpers';
import { featureEach } from '@turf/meta';
import KDBush from 'kdbush';
import { around } from 'geokdbush';

enum PointType {
    core,
    noise
}

export class DBSCAN {
    private points: FeatureCollection<Point>;
    private index: any;
    private eps: number;
    private minPts: number;
    private clusterIdx = 0;

    constructor(points: FeatureCollection<Point>, eps: number, minPts: number) {
        this.points = points;
        this.eps = eps;
        this.minPts = minPts;
    }

    // see: https://en.wikipedia.org/wiki/DBSCAN
    public run() {
        this.index = new KDBush(this.points.features, (f) => f.geometry.coordinates[0], (f) => f.geometry.coordinates[1]);
    
        featureEach(this.points, (p, pIdx) => {
            if (p.properties!['dbscan'] != null) return;

            const neigbors = this.RangeQuery(p.geometry);
            if(neigbors.features.length + 1 < this.minPts) {
                this.label(p, PointType.noise);
                return;
            }
            this.clusterIdx++;
            this.label(p, PointType.core);
            featureEach(neigbors, (q, qIdx) => {
                if(q.properties!['dbscan'] == PointType.noise) {
                    this.label(q, PointType.core);
                }
                if(q.properties!['dbscan'] != null) return;
                this.label(q, PointType.core);
                const neigborsExpand = this.RangeQuery(q.geometry as Point);
                if (neigborsExpand.features.length + 1 >= this.minPts) {
                    featureEach(neigborsExpand, (n, nIdx) => {
                        neigbors.features.push(n);
                        return;
                    });
                }
            });
        });
        return this.points;
    }

    private RangeQuery(q: Point) {
        // const neigbors: any[] = [];
        const neigbors = around(this.index, q.coordinates[0], q.coordinates[1], Infinity, this.eps / 1000) as any[];
        // featureEach(this.points, (p, pIdx) => {
        //     const dist = distance(q, p, { units: 'meters' })
        //     if(dist <= this.eps && dist != 0) {
        //         neigbors.push(p);
        //     }
        // });
        return featureCollection(neigbors);
    }

    private label(p: Feature, type: PointType) {
        p.properties!['dbscan'] = type;
        if (type == PointType.core) p.properties!['cluster'] = this.clusterIdx;
    }
}
import { FeatureCollection, Point, featureCollection, Feature, feature } from '@turf/helpers';
import { featureEach } from '@turf/meta';
import KDBush from 'kdbush';
import { around } from 'geokdbush';
import util from 'util';

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

        for (const p of this.points.features) {
            if (p.properties!['dbscan'] != null) continue;

            const neigbors = this.RangeQuery(p);
            if (neigbors.features.length < this.minPts) {
                this.label(p, PointType.noise);
                continue;
            }
            this.clusterIdx++;
            this.label(p, PointType.core);

            const index = neigbors.features.indexOf(p);
            neigbors.features.splice(index, 1);
            for (const q of neigbors.features) {
                if (q.properties!['dbscan'] == PointType.noise) {
                    this.label(q, PointType.core);
                }
                if (q.properties!['dbscan'] != null) continue;
                this.label(q, PointType.core);
                const neigborsExpand = this.RangeQuery(q as Feature<Point>);
                if (neigborsExpand.features.length >= this.minPts) {
                    for (const n of neigborsExpand.features) {
                        neigbors.features.push(n);
                    };
                }
            }
        }
        return this.points;
    }

    private RangeQuery(q: Feature<Point>) {
        const neigbors: Feature[] = around(this.index, q.geometry.coordinates[0], q.geometry.coordinates[1], Infinity, this.eps / 1000);
        return this.filterDirections(q, featureCollection(neigbors));
    }

    private label(p: Feature, type: PointType) {
        p.properties!['dbscan'] = type;
        if (type == PointType.core) p.properties!['cluster'] = this.clusterIdx;
    }

    private filterDirections(p: Feature, neigbors: FeatureCollection) {
        return featureCollection(neigbors.features.filter(f => {
            const bearing = (f.properties!['direction'] - p.properties!['direction'] + 180) % 360 - 180;
            return bearing < 45 && bearing > - 45;
        }));
    }
}
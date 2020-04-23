import clustersDbscan from '@turf/clusters-dbscan';
import { DBSCAN } from './dbscan';
import { FeatureCollection, Point, point } from '@turf/helpers';
import { performance } from 'perf_hooks';
const points = require("all-the-cities");

const cities: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
points.map((city: any) => cities.features.push(point(city.loc.coordinates, { 'direction': Math.round(Math.random()) ? 0 : 180})));

// DBSCAN: O(n log n) bzw. O(n^2) im Worst Case
// 10.000 Punkte: 9,72s (dbscan) vs. 10,82s (clusterDbscan)
// 100.000 Punkte: 1119,67s (dbscan) vs. 1143,89 (clusterDbscan)
// 100.000 Punkten: 0,96s (dbscan, mit aktivem Spatial Indexing)
// 100.000 Punkten: 1,96s (dbscan, mit aktivem Spatial Indexing & random Direction)
{
    console.log("dbscan");
    const start = performance.now();
    const dbscan = new DBSCAN(cities, 10000, 3);
    dbscan.run();
    console.log(`dbscan took ${(performance.now() - start) / 1000} s!`);
}
{
    console.log("clusterDbscan");
    const start = performance.now();
    clustersDbscan(cities, 10, { units: 'kilometers', minPoints: 3 });
    console.log(`clusterDbscan took ${(performance.now() - start) / 1000} s!`);
}
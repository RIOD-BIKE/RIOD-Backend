import { featureCollection, FeatureCollection, point, Point } from '@turf/helpers';
import { DBSCAN } from './../dbscan/dbscan';
import test from 'ava';
import util from 'util';

test('cluster normal', t => {
    const dbscan = new DBSCAN(getDemoPoints(), 5, 3);
    const clusters = dbscan.run();
    clusters.features.forEach((feature, idx) => {
        if (idx != 5) {
            t.is(feature.properties!['cluster'], 1);
            t.is(feature.properties!['dbscan'], 0);
        } else {
            t.is(feature.properties!['cluster'], undefined);
            t.is(feature.properties!['dbscan'], 1);
        }
    });
});

test('cluster with too small radius (eps)', t => {
    const dbscan = new DBSCAN(getDemoPoints(), 4, 3);
    const clusters = dbscan.run();
    clusters.features.forEach(feature => {
        t.is(feature.properties!['cluster'], undefined);
        t.is(feature.properties!['dbscan'], 1);
    });
});

test('cluster with too large radius (eps)', t => {
    const dbscan = new DBSCAN(getDemoPoints(), 24, 3);
    const clusters = dbscan.run();
    clusters.features.forEach(feature => {
        t.is(feature.properties!['cluster'], 1);
        t.is(feature.properties!['dbscan'], 0);
    });
});

test('cluster with direction', t => {
    const dbscan = new DBSCAN(getDemoPointsWithDirection(), 5, 4);
    const clusters = dbscan.run();
    console.log(util.inspect(clusters, false, null));
    clusters.features.forEach((feature, idx) => {
        if (idx < 4) {
            t.is(feature.properties!['cluster'], 1);
            t.is(feature.properties!['dbscan'], 0);
        } else if (idx < 7) {
            t.is(feature.properties!['cluster'], 2);
            t.is(feature.properties!['dbscan'], 0);
        } else {
            t.is(feature.properties!['cluster'], undefined);
            t.is(feature.properties!['dbscan'], 1);
        }
    });
});

test('cluster with direction, smaller cluster size', t => {
    const dbscan = new DBSCAN(getDemoPointsWithDirection(), 5, 3);
    const clusters = dbscan.run();
    clusters.features.forEach((feature, idx) => {
        if (idx < 4) {
            t.is(feature.properties!['cluster'], 1);
            t.is(feature.properties!['dbscan'], 0);
        } else if (idx < 7) {
            t.is(feature.properties!['cluster'], 2);
            t.is(feature.properties!['dbscan'], 0);
        } else {
            t.is(feature.properties!['cluster'], undefined);
            t.is(feature.properties!['dbscan'], 1);
        }
    });
});


function getDemoPoints() {
    const demo = {
        "user_1": {
            "direction": 0,
            "position": [52.284209, 8.022949]
        },
        "user_2": {
            "direction": 0,
            "position": [52.284245, 8.02296]
        },
        "user_3": {
            "direction": 0,
            "position": [52.284284, 8.022968]
        },
        "user_4": {
            "direction": 0,
            "position": [52.284325, 8.022973]
        },
        "user_5": {
            "direction": 0,
            "position": [52.284365, 8.022982]
        },
        "user_6": {
            "direction": 0,
            "position": [52.284569, 8.023030]
        }
    }
    const points: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
    for (const [userId, userInfo] of Object.entries(demo)) {
        points.features.push(point(userInfo.position, { userId: userId, direction: userInfo.direction }));
    }
    return points;
}

function getDemoPointsWithDirection() {
    const demo = {
        "user_1": {
            "direction": 0,
            "position": [52.284209, 8.022949]
        },
        "user_2": {
            "direction": 0,
            "position": [52.284245, 8.02296]
        },
        "user_3": {
            "direction": 0,
            "position": [52.284284, 8.022968]
        },
        "user_4": {
            "direction": 0,
            "position": [52.284325, 8.022973]
        },
        "user_5": {
            "direction": 180,
            "position": [52.284348, 8.022978]
        },
        "user_6": {
            "direction": 180,
            "position": [52.284365, 8.022982]
        },
        "user_7": {
            "direction": 180,
            "position": [52.284409, 8.022993]
        },
        "user_8": {
            "direction": 180,
            "position": [52.284569, 8.023030]
        }
    }
    const points: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
    for (const [userId, userInfo] of Object.entries(demo)) {
        points.features.push(point(userInfo.position, { userId: userId, direction: userInfo.direction }));
    }
    return points;
}
/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

/**
 * Forked from https://github.com/d3/d3-geo-projection
 * Pasted from https://github.com/etpinard/d3-geo-projection
 *
 * Containing only the 'most useful' projection types
 * and compatible with CommonJs
 *
 */

var d3 = require('d3');

function addProjectionToD3() {
  d3.geo.project = function(object, projection) {
    var stream = projection.stream;
    if (!stream) throw new Error("not yet supported");
    return (object && d3_geo_projectObjectType.hasOwnProperty(object.type) ? d3_geo_projectObjectType[object.type] : d3_geo_projectGeometry)(object, stream);
  };
  function d3_geo_projectFeature(object, stream) {
    return {
      type: "Feature",
      id: object.id,
      properties: object.properties,
      geometry: d3_geo_projectGeometry(object.geometry, stream)
    };
  }
  function d3_geo_projectGeometry(geometry, stream) {
    if (!geometry) return null;
    if (geometry.type === "GeometryCollection") return {
      type: "GeometryCollection",
      geometries: object.geometries.map(function(geometry) {
        return d3_geo_projectGeometry(geometry, stream);
      })
    };
    if (!d3_geo_projectGeometryType.hasOwnProperty(geometry.type)) return null;
    var sink = d3_geo_projectGeometryType[geometry.type];
    d3.geo.stream(geometry, stream(sink));
    return sink.result();
  }
  var d3_geo_projectObjectType = {
    Feature: d3_geo_projectFeature,
    FeatureCollection: function(object, stream) {
      return {
        type: "FeatureCollection",
        features: object.features.map(function(feature) {
          return d3_geo_projectFeature(feature, stream);
        })
      };
    }
  };
  var d3_geo_projectPoints = [], d3_geo_projectLines = [];
  var d3_geo_projectPoint = {
    point: function(x, y) {
      d3_geo_projectPoints.push([ x, y ]);
    },
    result: function() {
      var result = !d3_geo_projectPoints.length ? null : d3_geo_projectPoints.length < 2 ? {
        type: "Point",
        coordinates: d3_geo_projectPoints[0]
      } : {
        type: "MultiPoint",
        coordinates: d3_geo_projectPoints
      };
      d3_geo_projectPoints = [];
      return result;
    }
  };
  var d3_geo_projectLine = {
    lineStart: d3_geo_projectNoop,
    point: function(x, y) {
      d3_geo_projectPoints.push([ x, y ]);
    },
    lineEnd: function() {
      if (d3_geo_projectPoints.length) d3_geo_projectLines.push(d3_geo_projectPoints),
      d3_geo_projectPoints = [];
    },
    result: function() {
      var result = !d3_geo_projectLines.length ? null : d3_geo_projectLines.length < 2 ? {
        type: "LineString",
        coordinates: d3_geo_projectLines[0]
      } : {
        type: "MultiLineString",
        coordinates: d3_geo_projectLines
      };
      d3_geo_projectLines = [];
      return result;
    }
  };
  var d3_geo_projectPolygon = {
    polygonStart: d3_geo_projectNoop,
    lineStart: d3_geo_projectNoop,
    point: function(x, y) {
      d3_geo_projectPoints.push([ x, y ]);
    },
    lineEnd: function() {
      var n = d3_geo_projectPoints.length;
      if (n) {
        do d3_geo_projectPoints.push(d3_geo_projectPoints[0].slice()); while (++n < 4);
        d3_geo_projectLines.push(d3_geo_projectPoints), d3_geo_projectPoints = [];
      }
    },
    polygonEnd: d3_geo_projectNoop,
    result: function() {
      if (!d3_geo_projectLines.length) return null;
      var polygons = [], holes = [];
      d3_geo_projectLines.forEach(function(ring) {
        if (d3_geo_projectClockwise(ring)) polygons.push([ ring ]); else holes.push(ring);
      });
      holes.forEach(function(hole) {
        var point = hole[0];
        polygons.some(function(polygon) {
          if (d3_geo_projectContains(polygon[0], point)) {
            polygon.push(hole);
            return true;
          }
        }) || polygons.push([ hole ]);
      });
      d3_geo_projectLines = [];
      return !polygons.length ? null : polygons.length > 1 ? {
        type: "MultiPolygon",
        coordinates: polygons
      } : {
        type: "Polygon",
        coordinates: polygons[0]
      };
    }
  };
  var d3_geo_projectGeometryType = {
    Point: d3_geo_projectPoint,
    MultiPoint: d3_geo_projectPoint,
    LineString: d3_geo_projectLine,
    MultiLineString: d3_geo_projectLine,
    Polygon: d3_geo_projectPolygon,
    MultiPolygon: d3_geo_projectPolygon,
    Sphere: d3_geo_projectPolygon
  };
  function d3_geo_projectNoop() {}
  function d3_geo_projectClockwise(ring) {
    if ((n = ring.length) < 4) return false;
    var i = 0, n, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
    while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
    return area <= 0;
  }
  function d3_geo_projectContains(ring, point) {
    var x = point[0], y = point[1], contains = false;
    for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
      var pi = ring[i], xi = pi[0], yi = pi[1], pj = ring[j], xj = pj[0], yj = pj[1];
      if (yi > y ^ yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) contains = !contains;
    }
    return contains;
  }
  var ε = 1e-6, ε2 = ε * ε, π = Math.PI, halfπ = π / 2, sqrtπ = Math.sqrt(π), radians = π / 180, degrees = 180 / π;
  function sinci(x) {
    return x ? x / Math.sin(x) : 1;
  }
  function sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function asqrt(x) {
    return x > 0 ? Math.sqrt(x) : 0;
  }
  var projection = d3.geo.projection, projectionMutator = d3.geo.projectionMutator;
  d3.geo.interrupt = function(project) {
    var lobes = [ [ [ [ -π, 0 ], [ 0, halfπ ], [ π, 0 ] ] ], [ [ [ -π, 0 ], [ 0, -halfπ ], [ π, 0 ] ] ] ];
    var bounds;
    function forward(λ, φ) {
      var sign = φ < 0 ? -1 : +1, hemilobes = lobes[+(φ < 0)];
      for (var i = 0, n = hemilobes.length - 1; i < n && λ > hemilobes[i][2][0]; ++i) ;
      var coordinates = project(λ - hemilobes[i][1][0], φ);
      coordinates[0] += project(hemilobes[i][1][0], sign * φ > sign * hemilobes[i][0][1] ? hemilobes[i][0][1] : φ)[0];
      return coordinates;
    }
    function reset() {
      bounds = lobes.map(function(hemilobes) {
        return hemilobes.map(function(lobe) {
          var x0 = project(lobe[0][0], lobe[0][1])[0], x1 = project(lobe[2][0], lobe[2][1])[0], y0 = project(lobe[1][0], lobe[0][1])[1], y1 = project(lobe[1][0], lobe[1][1])[1], t;
          if (y0 > y1) t = y0, y0 = y1, y1 = t;
          return [ [ x0, y0 ], [ x1, y1 ] ];
        });
      });
    }
    if (project.invert) forward.invert = function(x, y) {
      var hemibounds = bounds[+(y < 0)], hemilobes = lobes[+(y < 0)];
      for (var i = 0, n = hemibounds.length; i < n; ++i) {
        var b = hemibounds[i];
        if (b[0][0] <= x && x < b[1][0] && b[0][1] <= y && y < b[1][1]) {
          var coordinates = project.invert(x - project(hemilobes[i][1][0], 0)[0], y);
          coordinates[0] += hemilobes[i][1][0];
          return pointEqual(forward(coordinates[0], coordinates[1]), [ x, y ]) ? coordinates : null;
        }
      }
    };
    var projection = d3.geo.projection(forward), stream_ = projection.stream;
    projection.stream = function(stream) {
      var rotate = projection.rotate(), rotateStream = stream_(stream), sphereStream = (projection.rotate([ 0, 0 ]),
      stream_(stream));
      projection.rotate(rotate);
      rotateStream.sphere = function() {
        d3.geo.stream(sphere(), sphereStream);
      };
      return rotateStream;
    };
    projection.lobes = function(_) {
      if (!arguments.length) return lobes.map(function(lobes) {
        return lobes.map(function(lobe) {
          return [ [ lobe[0][0] * 180 / π, lobe[0][1] * 180 / π ], [ lobe[1][0] * 180 / π, lobe[1][1] * 180 / π ], [ lobe[2][0] * 180 / π, lobe[2][1] * 180 / π ] ];
        });
      });
      lobes = _.map(function(lobes) {
        return lobes.map(function(lobe) {
          return [ [ lobe[0][0] * π / 180, lobe[0][1] * π / 180 ], [ lobe[1][0] * π / 180, lobe[1][1] * π / 180 ], [ lobe[2][0] * π / 180, lobe[2][1] * π / 180 ] ];
        });
      });
      reset();
      return projection;
    };
    function sphere() {
      var ε = 1e-6, coordinates = [];
      for (var i = 0, n = lobes[0].length; i < n; ++i) {
        var lobe = lobes[0][i], λ0 = lobe[0][0] * 180 / π, φ0 = lobe[0][1] * 180 / π, φ1 = lobe[1][1] * 180 / π, λ2 = lobe[2][0] * 180 / π, φ2 = lobe[2][1] * 180 / π;
        coordinates.push(resample([ [ λ0 + ε, φ0 + ε ], [ λ0 + ε, φ1 - ε ], [ λ2 - ε, φ1 - ε ], [ λ2 - ε, φ2 + ε ] ], 30));
      }
      for (var i = lobes[1].length - 1; i >= 0; --i) {
        var lobe = lobes[1][i], λ0 = lobe[0][0] * 180 / π, φ0 = lobe[0][1] * 180 / π, φ1 = lobe[1][1] * 180 / π, λ2 = lobe[2][0] * 180 / π, φ2 = lobe[2][1] * 180 / π;
        coordinates.push(resample([ [ λ2 - ε, φ2 - ε ], [ λ2 - ε, φ1 + ε ], [ λ0 + ε, φ1 + ε ], [ λ0 + ε, φ0 - ε ] ], 30));
      }
      return {
        type: "Polygon",
        coordinates: [ d3.merge(coordinates) ]
      };
    }
    function resample(coordinates, m) {
      var i = -1, n = coordinates.length, p0 = coordinates[0], p1, dx, dy, resampled = [];
      while (++i < n) {
        p1 = coordinates[i];
        dx = (p1[0] - p0[0]) / m;
        dy = (p1[1] - p0[1]) / m;
        for (var j = 0; j < m; ++j) resampled.push([ p0[0] + j * dx, p0[1] + j * dy ]);
        p0 = p1;
      }
      resampled.push(p1);
      return resampled;
    }
    function pointEqual(a, b) {
      return Math.abs(a[0] - b[0]) < ε && Math.abs(a[1] - b[1]) < ε;
    }
    return projection;
  };
  function eckert4(λ, φ) {
    var k = (2 + halfπ) * Math.sin(φ);
    φ /= 2;
    for (var i = 0, δ = Infinity; i < 10 && Math.abs(δ) > ε; i++) {
      var cosφ = Math.cos(φ);
      φ -= δ = (φ + Math.sin(φ) * (cosφ + 2) - k) / (2 * cosφ * (1 + cosφ));
    }
    return [ 2 / Math.sqrt(π * (4 + π)) * λ * (1 + Math.cos(φ)), 2 * Math.sqrt(π / (4 + π)) * Math.sin(φ) ];
  }
  eckert4.invert = function(x, y) {
    var A = .5 * y * Math.sqrt((4 + π) / π), k = asin(A), c = Math.cos(k);
    return [ x / (2 / Math.sqrt(π * (4 + π)) * (1 + c)), asin((k + A * (c + 2)) / (2 + halfπ)) ];
  };
  (d3.geo.eckert4 = function() {
    return projection(eckert4);
  }).raw = eckert4;
  var hammerAzimuthalEqualArea = d3.geo.azimuthalEqualArea.raw;
  function hammer(A, B) {
    if (arguments.length < 2) B = A;
    if (B === 1) return hammerAzimuthalEqualArea;
    if (B === Infinity) return hammerQuarticAuthalic;
    function forward(λ, φ) {
      var coordinates = hammerAzimuthalEqualArea(λ / B, φ);
      coordinates[0] *= A;
      return coordinates;
    }
    forward.invert = function(x, y) {
      var coordinates = hammerAzimuthalEqualArea.invert(x / A, y);
      coordinates[0] *= B;
      return coordinates;
    };
    return forward;
  }
  function hammerProjection() {
    var B = 2, m = projectionMutator(hammer), p = m(B);
    p.coefficient = function(_) {
      if (!arguments.length) return B;
      return m(B = +_);
    };
    return p;
  }
  function hammerQuarticAuthalic(λ, φ) {
    return [ λ * Math.cos(φ) / Math.cos(φ /= 2), 2 * Math.sin(φ) ];
  }
  hammerQuarticAuthalic.invert = function(x, y) {
    var φ = 2 * asin(y / 2);
    return [ x * Math.cos(φ / 2) / Math.cos(φ), φ ];
  };
  (d3.geo.hammer = hammerProjection).raw = hammer;
  function kavrayskiy7(λ, φ) {
    return [ 3 * λ / (2 * π) * Math.sqrt(π * π / 3 - φ * φ), φ ];
  }
  kavrayskiy7.invert = function(x, y) {
    return [ 2 / 3 * π * x / Math.sqrt(π * π / 3 - y * y), y ];
  };
  (d3.geo.kavrayskiy7 = function() {
    return projection(kavrayskiy7);
  }).raw = kavrayskiy7;
  function miller(λ, φ) {
    return [ λ, 1.25 * Math.log(Math.tan(π / 4 + .4 * φ)) ];
  }
  miller.invert = function(x, y) {
    return [ x, 2.5 * Math.atan(Math.exp(.8 * y)) - .625 * π ];
  };
  (d3.geo.miller = function() {
    return projection(miller);
  }).raw = miller;
  function mollweideBromleyθ(Cp) {
    return function(θ) {
      var Cpsinθ = Cp * Math.sin(θ), i = 30, δ;
      do θ -= δ = (θ + Math.sin(θ) - Cpsinθ) / (1 + Math.cos(θ)); while (Math.abs(δ) > ε && --i > 0);
      return θ / 2;
    };
  }
  function mollweideBromley(Cx, Cy, Cp) {
    var θ = mollweideBromleyθ(Cp);
    function forward(λ, φ) {
      return [ Cx * λ * Math.cos(φ = θ(φ)), Cy * Math.sin(φ) ];
    }
    forward.invert = function(x, y) {
      var θ = asin(y / Cy);
      return [ x / (Cx * Math.cos(θ)), asin((2 * θ + Math.sin(2 * θ)) / Cp) ];
    };
    return forward;
  }
  var mollweideθ = mollweideBromleyθ(π), mollweide = mollweideBromley(Math.SQRT2 / halfπ, Math.SQRT2, π);
  (d3.geo.mollweide = function() {
    return projection(mollweide);
  }).raw = mollweide;
  function naturalEarth(λ, φ) {
    var φ2 = φ * φ, φ4 = φ2 * φ2;
    return [ λ * (.8707 - .131979 * φ2 + φ4 * (-.013791 + φ4 * (.003971 * φ2 - .001529 * φ4))), φ * (1.007226 + φ2 * (.015085 + φ4 * (-.044475 + .028874 * φ2 - .005916 * φ4))) ];
  }
  naturalEarth.invert = function(x, y) {
    var φ = y, i = 25, δ;
    do {
      var φ2 = φ * φ, φ4 = φ2 * φ2;
      φ -= δ = (φ * (1.007226 + φ2 * (.015085 + φ4 * (-.044475 + .028874 * φ2 - .005916 * φ4))) - y) / (1.007226 + φ2 * (.015085 * 3 + φ4 * (-.044475 * 7 + .028874 * 9 * φ2 - .005916 * 11 * φ4)));
    } while (Math.abs(δ) > ε && --i > 0);
    return [ x / (.8707 + (φ2 = φ * φ) * (-.131979 + φ2 * (-.013791 + φ2 * φ2 * φ2 * (.003971 - .001529 * φ2)))), φ ];
  };
  (d3.geo.naturalEarth = function() {
    return projection(naturalEarth);
  }).raw = naturalEarth;
  var robinsonConstants = [ [ .9986, -.062 ], [ 1, 0 ], [ .9986, .062 ], [ .9954, .124 ], [ .99, .186 ], [ .9822, .248 ], [ .973, .31 ], [ .96, .372 ], [ .9427, .434 ], [ .9216, .4958 ], [ .8962, .5571 ], [ .8679, .6176 ], [ .835, .6769 ], [ .7986, .7346 ], [ .7597, .7903 ], [ .7186, .8435 ], [ .6732, .8936 ], [ .6213, .9394 ], [ .5722, .9761 ], [ .5322, 1 ] ];
  robinsonConstants.forEach(function(d) {
    d[1] *= 1.0144;
  });
  function robinson(λ, φ) {
    var i = Math.min(18, Math.abs(φ) * 36 / π), i0 = Math.floor(i), di = i - i0, ax = (k = robinsonConstants[i0])[0], ay = k[1], bx = (k = robinsonConstants[++i0])[0], by = k[1], cx = (k = robinsonConstants[Math.min(19, ++i0)])[0], cy = k[1], k;
    return [ λ * (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2), (φ > 0 ? halfπ : -halfπ) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2) ];
  }
  robinson.invert = function(x, y) {
    var yy = y / halfπ, φ = yy * 90, i = Math.min(18, Math.abs(φ / 5)), i0 = Math.max(0, Math.floor(i));
    do {
      var ay = robinsonConstants[i0][1], by = robinsonConstants[i0 + 1][1], cy = robinsonConstants[Math.min(19, i0 + 2)][1], u = cy - ay, v = cy - 2 * by + ay, t = 2 * (Math.abs(yy) - by) / u, c = v / u, di = t * (1 - c * t * (1 - 2 * c * t));
      if (di >= 0 || i0 === 1) {
        φ = (y >= 0 ? 5 : -5) * (di + i);
        var j = 50, δ;
        do {
          i = Math.min(18, Math.abs(φ) / 5);
          i0 = Math.floor(i);
          di = i - i0;
          ay = robinsonConstants[i0][1];
          by = robinsonConstants[i0 + 1][1];
          cy = robinsonConstants[Math.min(19, i0 + 2)][1];
          φ -= (δ = (y >= 0 ? halfπ : -halfπ) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2) - y) * degrees;
        } while (Math.abs(δ) > ε2 && --j > 0);
        break;
      }
    } while (--i0 >= 0);
    var ax = robinsonConstants[i0][0], bx = robinsonConstants[i0 + 1][0], cx = robinsonConstants[Math.min(19, i0 + 2)][0];
    return [ x / (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2), φ * radians ];
  };
  (d3.geo.robinson = function() {
    return projection(robinson);
  }).raw = robinson;
  function sinusoidal(λ, φ) {
    return [ λ * Math.cos(φ), φ ];
  }
  sinusoidal.invert = function(x, y) {
    return [ x / Math.cos(y), y ];
  };
  (d3.geo.sinusoidal = function() {
    return projection(sinusoidal);
  }).raw = sinusoidal;
}

module.exports = addProjectionToD3;

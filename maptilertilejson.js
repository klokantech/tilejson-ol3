/**
 * Copyright (C) 2016 Klokan Technologies GmbH (info@klokantech.com)
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

var loadMapTilerTileJSON = function(urlOrObject, callback) {
  var processData = function(data) {
    var attribution = data['attribution'],
        scheme = data['scheme'] || 'xyz',
        tiles = data['tiles'],
        minZoom = data['minzoom'] || 0,
        maxZoom = data['maxzoom'] || 22,
        bounds = data['bounds'] || [-180, -90, 180, 90],
        profile = data['profile'] || 'mercator',
        crs = (data['crs'] || 'EPSG:3857'),
        proj4def = data['proj4'],
        extent = data['extent'],
        tileMatrix = data['tile_matrix'];

    if (window['proj4']) {
      var proj4def = data['proj4'];
      if (proj4def) {
        window['proj4'].defs(crs, proj4def);
      }
    }

    var flipY = scheme != 'tms';

    var sourceExtent = extent;

    var tileGrid;
    if (tileMatrix) {
      var origins = [], resolutions = [], tileSizes = [];
      var combinedLevelExtents = ol.extent.createEmpty();

      tileMatrix.forEach(function(level) {
        tileSizes.push(level['tile_size'] || [256, 256]);
        ol.extent.extend(combinedLevelExtents, level['extent']);
        origins.push(level['origin'] || [extent[0], extent[3]]);
        var pixelSize = level['pixel_size'] || [1, 1];
        resolutions.push(Math.abs(pixelSize[0]));
        if (pixelSize[1] > 0) {
          flipY = false;
        }
      });

      tileGrid = new ol.tilegrid.TileGrid({
        minZoom: minZoom,
        origins: origins,
        resolutions: resolutions,
        tileSizes: tileSizes
      });

      sourceExtent = sourceExtent || combinedLevelExtents;
    } else {
      tileGrid = ol.tilegrid.createXYZ({
        extent: ol.proj.get('EPSG:3857').getExtent(),
        maxZoom: maxZoom,
        minZoom: minZoom
      });
    }

    var source = new ol.source.XYZ({
      projection: ol.proj.get(crs),
      maxZoom: maxZoom,
      minZoom: minZoom,
      reprojectionErrorThreshold: 0.1,
      tileGrid: tileGrid,
      attribution: attribution,
      tileUrlFunction: function(coord, pixelRatio, projection) {
          var z = coord[0];
          var x = coord[1];
          var y = coord[2];
          if (flipY) {
            y = -y - 1;
          }
          var url = tiles[(z + x + y) % tiles.length].
              replace('{z}', z).replace('{x}', x).replace('{y}', y);
          return url;
        }
    });
    source.setRenderReprojectionEdges(true);

    callback(source, bounds, sourceExtent);
  };

  if (typeof urlOrObject == 'string') {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
      processData(this.response);
    });

    xhr.open('GET', urlOrObject);
    xhr.responseType = 'json';
    xhr.send();
  } else {
    processData(urlOrObject, callback);
  }
};

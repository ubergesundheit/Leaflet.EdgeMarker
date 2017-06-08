(function(L) {
  'use strict';
  var classToExtend = 'Class';
  if (L.version.charAt(0) !== '0') {
    classToExtend = 'Layer';
  }

  L.EdgeMarker = L[classToExtend].extend({
    options: {
      distanceOpacity: false,
      distanceOpacityFactor: 4,
      layerGroup: null,
      rotateIcons: true,
      icon: L.icon({
        iconUrl: L.Icon.Default.imagePath + '/edge-arrow-marker.png',
        clickable: true,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    },

    initialize: function(options) {
      L.setOptions(this, options);
    },

    addTo: function(map) {
      this._map = map;

      // add a method to get applicable features
      if (typeof map._getFeatures !== 'function') {
        L.extend(map, {
          _getFeatures: function() {
            var out = [];
            for (var l in this._layers) {
              if (typeof this._layers[l].getLatLng !== 'undefined') {
                out.push(this._layers[l]);
              }
            }
            return out;
          }
        });
      }

      map.on('move', this._addEdgeMarkers, this);
      map.on('viewreset', this._addEdgeMarkers, this);

      this._addEdgeMarkers();

      map.addLayer(this);

      return this;
    },

    destroy: function() {
      if (this._map && this._borderMarkerLayer) {
        this._map.off('move', this._addEdgeMarkers, this);
        this._map.off('viewreset', this._addEdgeMarkers, this);

        this._borderMarkerLayer.clearLayers();
        this._map.removeLayer(this._borderMarkerLayer);

        delete this._map._getFeatures;

        this._borderMarkerLayer = undefined;
      }
    },

    onClick: function(e) {
      this._map.setView(e.target.options.latlng, this._map.getZoom());
    },

    onAdd: function() {},

    _borderMarkerLayer: undefined,

    _addEdgeMarkers: function() {
      if (typeof this._borderMarkerLayer === 'undefined') {
        this._borderMarkerLayer = new L.LayerGroup();
      }
      this._borderMarkerLayer.clearLayers();

      var features = [];
      if (this.options.layerGroup != null) {
        features = this.options.layerGroup.getLayers();
      } else {
        features = this._map._getFeatures();
      }

      var mapPixelBounds = this._map.getSize();

      var markerWidth = this.options.icon.options.iconSize[0];
      var markerHeight = this.options.icon.options.iconSize[1];

      for (var i = 0; i < features.length; i++) {
        var currentMarkerPosition = this._map.latLngToContainerPoint(
          features[i].getLatLng()
        );

        if (
          currentMarkerPosition.y < 0 ||
          currentMarkerPosition.y > mapPixelBounds.y ||
          currentMarkerPosition.x > mapPixelBounds.x ||
          currentMarkerPosition.x < 0
        ) {
          // get pos of marker
          var x = currentMarkerPosition.x;
          var y = currentMarkerPosition.y;
          var markerDistance;

          // we want to place EdgeMarker on the line from center screen to target,
          // and against the border of the screen
          // we know angel and its x or y cordiante
          // (depending if we want to place it against top/bottom edge or left right edge)
          // fromthat we can calculate the other cordinate

          var center = L.point(mapPixelBounds.x/2,mapPixelBounds.y/2);

          var rad = Math.atan2(center.y - y, center.x - x);
          var rad2TopLeftcorner = Math.atan2(center.y,center.x);

          // target is in between diagonals window/ hourglass
          // more out in y then in x
          if (Math.abs(rad) > rad2TopLeftcorner && Math.abs (rad) < Math.PI -rad2TopLeftcorner) {

            // bottom out
            if (y < center.y ){
              y = markerHeight/2;
              x = center.x -  (center.y-y) / Math.tan(Math.abs(rad));
              markerDistance = currentMarkerPosition.y - mapPixelBounds.y;
            // top out
            }else{
              y = mapPixelBounds.y - markerHeight/2;
              x = center.x -  (y-center.y)/ Math.tan(Math.abs(rad));
              markerDistance = -currentMarkerPosition.y;
            }
          }else {

            // left out
            if (x < center.x ){
              x = markerWidth/2;
              y = center.y -  (center.x-x ) *Math.tan(rad);
              markerDistance = -currentMarkerPosition.x;
            // right out
            }else{
              x = mapPixelBounds.x - markerWidth/2;
              y = center.y +  (x - center.x) *Math.tan(rad);
              markerDistance = currentMarkerPosition.x - mapPixelBounds.x;
            }
          }
          // change opacity on distance
          var newOptions = this.options;
          if (this.options.distanceOpacity) {
            newOptions.fillOpacity =
              (100 - markerDistance / this.options.distanceOpacityFactor) / 100;
          }

          // rotate markers
          if (this.options.rotateIcons) {
            var angle = rad / Math.PI * 180;
            newOptions.angle = angle;
          }

          var ref = { latlng: features[i].getLatLng() };
          newOptions = L.extend({}, newOptions, ref);

          var marker = L.rotatedMarker(
            this._map.containerPointToLatLng([x, y]),
            newOptions
          ).addTo(this._borderMarkerLayer);

          marker.on('click', this.onClick, marker);
        }
      }
      if (!this._map.hasLayer(this._borderMarkerLayer)) {
        this._borderMarkerLayer.addTo(this._map);
      }
    }
  });

  /*
   * L.rotatedMarker class is taken from https://github.com/bbecquet/Leaflet.PolylineDecorator.
   */
  L.RotatedMarker = L.Marker.extend({
    options: {
      angle: 0
    },

    statics: {
      TRANSFORM_ORIGIN: L.DomUtil.testProp([
        'transformOrigin',
        'WebkitTransformOrigin',
        'OTransformOrigin',
        'MozTransformOrigin',
        'msTransformOrigin'
      ])
    },

    _initIcon: function() {
      L.Marker.prototype._initIcon.call(this);

      this._icon.style[L.RotatedMarker.TRANSFORM_ORIGIN] = '50% 50%';
    },

    _setPos: function(pos) {
      L.Marker.prototype._setPos.call(this, pos);

      if (L.DomUtil.TRANSFORM) {
        // use the CSS transform rule if available
        this._icon.style[L.DomUtil.TRANSFORM] +=
          ' rotate(' + this.options.angle + 'deg)';
      } else if (L.Browser.ie) {
        // fallback for IE6, IE7, IE8
        var rad = this.options.angle * (Math.PI / 180),
          costheta = Math.cos(rad),
          sintheta = Math.sin(rad);
        this._icon.style.filter +=
          " progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11=" +
          costheta +
          ', M12=' +
          -sintheta +
          ', M21=' +
          sintheta +
          ', M22=' +
          costheta +
          ')';
      }
    },

    setAngle: function(ang) {
      this.options.angle = ang;
    }
  });

  L.rotatedMarker = function(pos, options) {
    return new L.RotatedMarker(pos, options);
  };

  L.edgeMarker = function(options) {
    return new L.EdgeMarker(options);
  };
})(L);

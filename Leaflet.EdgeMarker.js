(function (L) {
  'use strict';

  L.EdgeMarker = L.Class.extend({

    options: {
      icon: L.icon({
          iconUrl:  'images/edge-arrow-marker.png',
          clickable: true,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
      })
    },

    initialize: function (latlng,options) {
      this._target=latlng;
      L.setOptions(this, options);
    },

    addTo: function (map) {
      this._map = map;

      map.on('move', this._addEdgeMarkers, this);
      map.on('viewreset', this._addEdgeMarkers, this);

      this._addEdgeMarkers();
      return this;
    },

    onClick: function (e) {
      this._map.setView(e.target.options.latlng, this._map.getZoom());
    },

    onAdd: function () {},

    _borderMarkerLayer: undefined,

    _addEdgeMarkers: function () {
      if (typeof this._borderMarkerLayer === 'undefined') {
        this._borderMarkerLayer = new L.LayerGroup();
      }
      this._borderMarkerLayer.clearLayers();

      var mapPixelBounds = L.bounds([0,0],this._map.getSize());
      var currentMarkerPosition = this._map.latLngToContainerPoint( this._target);

        if (currentMarkerPosition.y < mapPixelBounds.min.y ||
            currentMarkerPosition.y > mapPixelBounds.max.y ||
            currentMarkerPosition.x > mapPixelBounds.max.x ||
            currentMarkerPosition.x < mapPixelBounds.min.x) {

            // get pos of marker
            var x = currentMarkerPosition.x;
            var y = currentMarkerPosition.y;

            var markerWidth = this.options.icon.options.iconSize[0];
            var markerHeight = this.options.icon.options.iconSize[1];

            var center = mapPixelBounds.getCenter();


            var rad = Math.atan2(center.y - y, center.x - x);
            var rad2TopLeftcorner= Math.atan2(center.y-mapPixelBounds.min.y,center.x-mapPixelBounds.min.x)

            // maker is in between diagonals window
            if (Math.abs(rad) > rad2TopLeftcorner && Math.abs (rad) < Math.PI -rad2TopLeftcorner) {
                x = center.x -  center.y/ Math.tan(Math.abs(rad));
            }else {
                if (x< center.x ){
                    y = center.y -  center.x *Math.tan(rad);
                }else{

                    y = center.y +  center.x *Math.tan(rad);
                }
            }

            // top out (top has y=0)
            if (currentMarkerPosition.y < mapPixelBounds.min.y ) {
                y = mapPixelBounds.min.y + markerHeight/2;
            // bottom out
            }
            else if (currentMarkerPosition.y > mapPixelBounds.max.y) {
                y = mapPixelBounds.max.y - markerHeight/2 ;
            }
            // right out
            if (currentMarkerPosition.x > mapPixelBounds.max.x) {
                x = mapPixelBounds.max.x - markerWidth / 2;
            // left out
            } else if (currentMarkerPosition.x < mapPixelBounds.min.x) {
                x = mapPixelBounds.min.x + markerWidth / 2;
            }


            var marker = L.marker(this._map.containerPointToLatLng([x, y]), this.options)
                .addTo(this._borderMarkerLayer);

            marker.on('click', this.onClick, marker);

            marker.setRotationAngle(rad / Math.PI * 180);
        }
      if (!this._map.hasLayer(this._borderMarkerLayer)) {
        this._borderMarkerLayer.addTo(this._map);
      }
    }
  });

  L.edgeMarker = function (latlng, options) {
    return new L.EdgeMarker(latlng, options);
  };

})(L);

(function (L) {
  'use strict';

  L.EdgeMarker = L.Class.extend({

    _borderMarkerLayer: undefined,

    addTo: function (map) {
      this._map = map;

      //add a method to get applicable features
      L.extend(map, {
        _getFeatures: function () {
          var out = [];
          for (var l in this._layers) {

            //test if this is the markerpane, does this even work?
            if(typeof this._layers[l].getLatLng !== 'undefined') {
              out.push(this._layers[l]);
            }
          }
          return out;
        }
      });

      map.on('move', this._addEdgeMarkers, this);

      this._addEdgeMarkers();

      map.addLayer(this);

      return this;
    },

    onAdd: function () {},

    _addEdgeMarkers: function () {
      if (typeof this._borderMarkerLayer === 'undefined') { 
        this._borderMarkerLayer = new L.LayerGroup(); 
      }
      this._borderMarkerLayer.clearLayers();

      var features = this._map._getFeatures();

      for(var i = 0; i < features.length; i++) {
        var markerPos = this._map.latLngToContainerPoint(features[i].getLatLng());
        var bounds = this._map.getContainer().getBoundingClientRect();

        if(markerPos.y < 0 || markerPos.y > bounds.height || 
          markerPos.x > bounds.width || markerPos.x < 0){

          var y = markerPos.y;
          if( markerPos.y < 0 ){ //oben raus
            y = 0;
          } else if (markerPos.y > bounds.height) { //unten raus
            y = bounds.height;   
          }

          var x = markerPos.x;
          if (markerPos.x > bounds.width) { // rechts raus
            x = bounds.width;
          } else if ( markerPos.x < 0) { // links raus
            x = 0;
          }

          L.circleMarker(this._map.containerPointToLatLng([x,y]), {radius: 12,weight: 0,fillColor: 'blue',fillOpacity: 1}).addTo(this._borderMarkerLayer);
         }
       }

       this._borderMarkerLayer.addTo(this._map);
    }
  });

})(L);

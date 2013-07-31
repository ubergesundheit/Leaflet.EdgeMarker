(function (L) {

  L.EdgeMarker = L.Class.extend({

    addTo: function (map) {
      this._map = map;
      L.extend(map,{
        _getMarkers: function() {
          out = [];
          for(l in this._layers){
            //test if this is the markerpane, does this even work?
            if(typeof this._layers[l].update !== 'undefined'){
              out.push(this._layers[l]);
            }
          }
          return out;
        }
      });

      map.on('move',this._addEdgeMarkers, this);

      this._addEdgeMarkers();

      map.addLayer(this);

      return this;
    },

    onAdd: function (map) {

    },

    _addEdgeMarkers: function () {
       if(typeof _borderMarkerLayer === 'undefined') _borderMarkerLayer = new L.LayerGroup();
       _borderMarkerLayer.clearLayers();

       var features = this._map._getMarkers();
       console.log(features.length);

       for(var i = 0; i < this._map.getPanes().markerPane.children.length; i++){
         var markerPos = this._map.getPanes().markerPane.children[i].getBoundingClientRect();
         var bounds = this._map.getContainer().getBoundingClientRect();

         if(markerPos.top < bounds.top || markerPos.bottom > bounds.bottom || markerPos.right > bounds.right || markerPos.left < bounds.left){
           var markerPosInBounds = this._map.latLngToContainerPoint(this._map._getMarkers()[i].getLatLng());
           if( markerPos.top < bounds.top ){ //oben raus
             var y = 0;
           } else if (markerPos.bottom > bounds.bottom) { //unten raus
              var y = bounds.height;
             
           } else {
             var y = markerPosInBounds.y;
           }

           if (markerPos.right > bounds.right) { // rechts raus
             var x = bounds.width;
           } else if ( markerPos.left < bounds.left) { // links raus
             var x = 0;
           } else {
             var x = markerPosInBounds.x;
           }

           L.circleMarker(this._map.containerPointToLatLng([x,y]),{radius: 12,weight: 0,fillColor: 'blue',fillOpacity: 1}).addTo(_borderMarkerLayer);
         }
       }

       _borderMarkerLayer.addTo(this._map);
    }
  });

})(L);
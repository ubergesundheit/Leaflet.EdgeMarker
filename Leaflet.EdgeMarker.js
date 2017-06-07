(function(L) {
  'use strict';
  var classToExtend = 'Class';
  if (L.version.charAt(0) !== '0') {
    classToExtend = 'Layer';
  }

  L.EdgeMarker = L[classToExtend].extend({
    options: {
      findEdge : function (map){
        return L.bounds([0,0], map.getSize());
      },
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

      map.on('move', this.update, this);
      map.on('viewreset', this.update, this);

      this.update();
      return this;
    },

    remove: function(){
      this._map.off('move', this.update, this);
      this._map.off('viewreset', this.update, this);
      this._removeMarker();
      L.Layer.prototype.remove.call(this);

    },

    onClick: function (e) {
      this._map.setView(e.latlng, this._map.getZoom());
    },

    _marker: undefined,

    update: function () {

      if ( this._target  != undefined && this._map!=undefined){
        var mapPixelBounds = this.options.findEdge(this._map);
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
          var rad2TopLeftcorner = Math.atan2(center.y-mapPixelBounds.min.y,center.x-mapPixelBounds.min.x);

          // maker is in between diagonals window
          if (Math.abs(rad) > rad2TopLeftcorner && Math.abs (rad) < Math.PI -rad2TopLeftcorner) {

            if (y < center.y ){
              y = mapPixelBounds.min.y + markerHeight/2;
              x = center.x -  (center.y-y) / Math.tan(Math.abs(rad));
            }else{

              y = mapPixelBounds.max.y - markerHeight/2;
              x = center.x -  (y-center.y)/ Math.tan(Math.abs(rad));
            }
          }else {
            if (x < center.x ){
              x = mapPixelBounds.min.x + markerWidth/2;
              y = center.y -  (center.x-x ) *Math.tan(rad);
            }else{
              x = mapPixelBounds.max.x - markerWidth/2;
              y = center.y +  (x - center.x) *Math.tan(rad);
            }
          }

          // top out (top has y=0)
          if (y < mapPixelBounds.min.y + markerHeight/2) {
            y = mapPixelBounds.min.y + markerHeight/2;
            // bottom out
          }
          else if (y > mapPixelBounds.max.y - markerHeight/2) {
            y = mapPixelBounds.max.y - markerHeight/2 ;
          }
          // right out
          if (x > mapPixelBounds.max.x- markerWidth / 2) {
            x = mapPixelBounds.max.x - markerWidth / 2;
            // left out
          } else if (x < mapPixelBounds.min.x+ markerWidth / 2) {
            x = mapPixelBounds.min.x + markerWidth / 2;
          }

          var  latlng = this._map.containerPointToLatLng([x, y]);
          if (typeof this._marker === 'undefined') {
            this._marker = L.marker(latlng, this.options).addTo(this._map);
            this._marker.on('click', this.onClick, this._marker);
          }else {
            this._marker.setLatLng(latlng);
          }

          this._marker.setRotationAngle(rad / Math.PI * 180);

        } else {
          this._removeMarker();
        }
      }else{
        this._removeMarker();
      }
    },

    _removeMarker: function (){
      if (! (typeof this._marker === 'undefined')) {
        this._marker.remove();
        this._marker=undefined;

      }
    },

    setTarget: function (latlng){
      this._target=latlng;
      this.update();
    },
    _makeThisTarget: function (object){this.setTarget(object.latlng);},
  });

  L.edgeMarker = function (latlng, options) {
    return new L.EdgeMarker(latlng, options);
  };

  L.Layer.include({

    bindEdgeMarker: function (options){
      if (!this._edgeMarkerHandlersAdded) {

        this._edgeMarker = L.edgeMarker(this.getLatLng(),options);
        this._edgeMarker.addTo(this._map);
        this.on('remove', this._edgeMarker.remove, this._edgeMarker);
        this.on('move', this._edgeMarker._makeThisTarget, this._edgeMarker);
        this._edgeMarkerHandlersAdded = true;
      }
      return this;
    },

    unbindEdgeMarker: function (){
      if (this._edgeMarker){
        this.off('remove', this._edgeMarker.remove, this._edgeMarker);
        this.off('move', this._edgeMarker._makeThisTarget, this._edgeMarker);
        this._edgeMarker.remove();
        this._edgeMarker=undefined;
        this._edgeMarkerHandlersAdded=false;
      }
    },
  });

})(L);

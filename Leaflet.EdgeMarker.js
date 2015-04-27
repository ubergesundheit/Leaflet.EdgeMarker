(function (L) {
  'use strict';

  L.EdgeMarker = L.Class.extend({

    options: {
      distanceOpacity: false,
      distanceOpacityFactor: 4,
      layerGroup: null,
      rotateIcons: true,
      icon : L.icon({
          iconUrl : L.Icon.Default.imagePath+'/edge-arrow-marker.png',
          clickable: true,
          iconSize: [48,48],
          iconAnchor: [24, 24]
      })
    },

    initialize: function(options) {
      L.setOptions(this, options);
    },

    addTo: function (map) {
      this._map = map;

      //add a method to get applicable features
      L.extend(map, {
        _getFeatures: function () {
          var out = [];
          for (var l in this._layers) {
            if(typeof this._layers[l].getLatLng !== 'undefined') {
              out.push(this._layers[l]);
            }
          }
          return out;
        }
      });

      map.on('move', this._addEdgeMarkers, this);
      map.on('viewreset', this._addEdgeMarkers, this);

      this._addEdgeMarkers();

      map.addLayer(this);

      return this;
    },
    
    onClick : function (e){
      this._map.setView(e.target.options.latlng,this._map.getZoom());
    },

    onAdd: function () {},

    _borderMarkerLayer: undefined,

    _addEdgeMarkers: function () {
      if (typeof this._borderMarkerLayer === 'undefined') { 
        this._borderMarkerLayer = new L.LayerGroup(); 
      }
      this._borderMarkerLayer.clearLayers();

      var features = [];
      if (this.options.layerGroup != null)
        features = this.options.layerGroup.getLayers();
      else
        features = this._map._getFeatures();
      
      var mapPixelBounds = this._map.getSize();
      
      var markerWidth = this.options.icon.options.iconSize[0];
      var markerHeight = this.options.icon.options.iconSize[1];
      
      for(var i = 0; i < features.length; i++) {
        
        var currentMarkerPosition = this._map.latLngToContainerPoint(
                                                  features[i].getLatLng());

        if(currentMarkerPosition.y < 0 || 
            currentMarkerPosition.y > mapPixelBounds.y || 
            currentMarkerPosition.x > mapPixelBounds.x || 
            currentMarkerPosition.x < 0) {
          
          
          // get pos of marker
          var x = currentMarkerPosition.x;
          var y = currentMarkerPosition.y;
          
            
          var mapPixelBounds = this._map.getSize();
          
          
          // bottom out
          if( currentMarkerPosition.y < 0 ) {
            y = 0 + markerHeight/2;
            var markerDistance = -currentMarkerPosition.y;
          // top out
          } else if (currentMarkerPosition.y > mapPixelBounds.y) {
            y = mapPixelBounds.y - markerHeight/2;   
            var markerDistance = currentMarkerPosition.y - mapPixelBounds.y;
          }

          
          // right out
          if (currentMarkerPosition.x > mapPixelBounds.x) {
            x = mapPixelBounds.x - markerWidth/2;
            var markerDistance = currentMarkerPosition.x - mapPixelBounds.x;
          // left out
          } else if ( currentMarkerPosition.x < 0) {
            x = 0 + markerWidth/2;
            var markerDistance = -currentMarkerPosition.x;
          }

          // change opacity on distance
          var newOptions = this.options;
          if(this.options.distanceOpacity){
            newOptions.fillOpacity = (100 - (markerDistance/this.options.distanceOpacityFactor))/100;
          }
          
          // rotate markers
          if (this.options.rotateIcons) {
            var centerX = mapPixelBounds.x/2;
            var centerY = mapPixelBounds.y/2;
            var angle = Math.atan2(centerY - y,centerX - x) / Math.PI * 180;
            newOptions.angle = angle;
          }
          
          var ref = { latlng : features[i].getLatLng() };
          var newOptions = L.extend({},newOptions,ref);
          
          var marker = L.rotatedMarker(this._map.containerPointToLatLng([x,y]), newOptions)
              .addTo(this._borderMarkerLayer);
          
          marker.on('click',this.onClick,marker);
        }
      }
      if(!this._map.hasLayer(this._borderMarkerLayer)) {
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

      _setPos: function (pos) {
          L.Marker.prototype._setPos.call(this, pos);
          
          if (L.DomUtil.TRANSFORM) {
              // use the CSS transform rule if available
              this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
          } else if(L.Browser.ie) {
              // fallback for IE6, IE7, IE8
              var rad = this.options.angle * (Math.PI / 180),
                  costheta = Math.cos(rad),
                  sintheta = Math.sin(rad);
              this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' + 
                  costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';                
          }
      }
});

  L.rotatedMarker = function (pos, options) {
    return new L.RotatedMarker(pos, options);
  };

  L.edgeMarker = function (options) {
    return new L.EdgeMarker(options);
  };

})(L);

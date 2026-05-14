import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface LeafletMapProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  onRegionChangeComplete?: (region: any) => void;
  style?: any;
  children?: React.ReactNode;
}

const LeafletMap = forwardRef(({ 
  initialRegion, 
  showsUserLocation, 
  onRegionChangeComplete,
  style,
  children 
}: LeafletMapProps, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: any) => {
      const script = `window.map.flyTo([${region.latitude}, ${region.longitude}], 15);`;
      webViewRef.current?.injectJavaScript(script);
    },
    fitToCoordinates: (coords: any[]) => {
      const bounds = JSON.stringify(coords.map(c => [c.latitude, c.longitude]));
      const script = `window.map.fitBounds(${bounds});`;
      webViewRef.current?.injectJavaScript(script);
    }
  }));

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; background: #121212; }
        .leaflet-container { background: #121212 !important; }
        .leaflet-tile { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${initialRegion?.latitude || 41.2995}, ${initialRegion?.longitude || 69.2401}], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        window.map = map;

        map.on('moveend', function() {
          var center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'onRegionChangeComplete',
            latitude: center.lat,
            longitude: center.lng
          }));
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'onRegionChangeComplete' && onRegionChangeComplete) {
            onRegionChangeComplete({
                latitude: data.latitude,
                longitude: data.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
            });
          }
        }}
        style={styles.webview}
      />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#121212',
  }
});

export default LeafletMap;

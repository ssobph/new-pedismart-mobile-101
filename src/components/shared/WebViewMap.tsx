import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  icon?: string;
  rotation?: number;
  type?: string;
}

interface WebViewMapProps {
  style?: any;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Marker[];
  showUserLocation?: boolean;
  enableLiveTracking?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  onRegionChange?: (region: any) => void;
  onMarkerPress?: (marker: any) => void;
  showDirections?: boolean;
  directionsConfig?: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    strokeColor?: string;
    strokeWidth?: number;
  };
  customMapStyle?: any;
  showPolyline?: boolean;
  polylineCoordinates?: { latitude: number; longitude: number }[];
  polylineConfig?: {
    strokeColor?: string;
    strokeWidth?: number;
    strokePattern?: number[];
  };
}

export interface WebViewMapRef {
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
  animateToRegion: (region: any) => void;
  animateToCoordinate: (coordinate: { latitude: number; longitude: number }) => void;
  getCurrentLocation: () => void;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
}

const WebViewMap = forwardRef<WebViewMapRef, WebViewMapProps>(({
  style,
  initialRegion,
  markers = [],
  showUserLocation = false,
  enableLiveTracking = false,
  onLocationUpdate,
  onRegionChange,
  onMarkerPress,
  showDirections = false,
  directionsConfig,
  customMapStyle,
  showPolyline = false,
  polylineCoordinates = [],
  polylineConfig
}, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coordinates, options = {}) => {
      const message = {
        type: 'fitToCoordinates',
        coordinates,
        options
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    animateToRegion: (region) => {
      const message = {
        type: 'animateToRegion',
        region
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    animateToCoordinate: (coordinate) => {
      const message = {
        type: 'animateToCoordinate',
        coordinate
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    getCurrentLocation: () => {
      const message = {
        type: 'getCurrentLocation'
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    startLiveTracking: () => {
      const message = {
        type: 'startLiveTracking'
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    },
    stopLiveTracking: () => {
      const message = {
        type: 'stopLiveTracking'
      };
      webViewRef.current?.postMessage(JSON.stringify(message));
    }
  }));

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'regionChange':
          onRegionChange?.(data.region);
          break;
        case 'markerPress':
          onMarkerPress?.(data.marker);
          break;
        case 'currentLocationFound':
          // Handle current location found
          if (onRegionChange) {
            onRegionChange({
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            });
          }
          break;
        case 'locationError':
          console.error('Location error:', data.error);
          break;
        case 'liveLocationUpdate':
          onLocationUpdate?.(data.location);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Google Maps</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; }
            #map { height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        
        <script>
            let map;
            let markers = [];
            let directionsService;
            let directionsRenderer;
            let userLocationMarker;
            let polyline;
            let liveTrackingWatchId = null;
            
            function initMap() {
                const initialRegion = ${JSON.stringify(initialRegion)};
                
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: initialRegion.latitude, lng: initialRegion.longitude },
                    zoom: 13,
                    styles: ${JSON.stringify(customMapStyle || [])},
                    disableDefaultUI: true,
                    gestureHandling: 'greedy'
                });
                
                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer({
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '${directionsConfig?.strokeColor || '#007AFF'}',
                        strokeWeight: ${directionsConfig?.strokeWidth || 5}
                    }
                });
                directionsRenderer.setMap(map);
                
                // Listen for map events with debouncing
                let regionChangeTimeout;
                map.addListener('center_changed', () => {
                    clearTimeout(regionChangeTimeout);
                    regionChangeTimeout = setTimeout(() => {
                        const center = map.getCenter();
                        const zoom = map.getZoom();
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'regionChange',
                            region: {
                                latitude: center.lat(),
                                longitude: center.lng(),
                                latitudeDelta: 180 / Math.pow(2, zoom),
                                longitudeDelta: 180 / Math.pow(2, zoom)
                            }
                        }));
                    }, 500); // Debounce for 500ms
                });
                
                // Show user location if enabled
                if (${showUserLocation}) {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((position) => {
                            const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            
                            userLocationMarker = new google.maps.Marker({
                                position: userLocation,
                                map: map,
                                icon: {
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: '#4285F4',
                                    fillOpacity: 1,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 2
                                }
                            });
                        });
                    }
                }
                
                // Start live tracking if enabled
                if (${enableLiveTracking}) {
                    startLiveTracking();
                }
                
                updateMarkers();
                updateDirections();
                updatePolyline();
            }
            
            function updateMarkers() {
                // Clear existing markers
                markers.forEach(marker => marker.setMap(null));
                markers = [];
                
                const markersData = ${JSON.stringify(markers)};
                
                markersData.forEach(markerData => {
                    let icon = null;
                    
                    if (markerData.type) {
                        // Custom icon based on type
                        icon = {
                            url: getIconUrl(markerData.type),
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 20)
                        };
                        
                        if (markerData.rotation) {
                            icon.rotation = markerData.rotation;
                        }
                    }
                    
                    const marker = new google.maps.Marker({
                        position: { lat: markerData.latitude, lng: markerData.longitude },
                        map: map,
                        title: markerData.title || '',
                        icon: icon
                    });
                    
                    marker.addListener('click', () => {
                        window.ReactNativeWebView?.postMessage(JSON.stringify({
                            type: 'markerPress',
                            marker: markerData
                        }));
                    });
                    
                    markers.push(marker);
                });
            }
            
            function getIconUrl(type) {
                // Return data URLs for different marker types
                switch(type) {
                    case 'bike':
                        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGRjZCMzUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIj4KPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6Ii8+CjwvcGF0aD4KPC9zdmc+Cjwvc3ZnPgo8L2NpcmNsZT4KPC9zdmc+';
                    case 'auto':
                        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGRkQ3MDAiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIj4KPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiPgo8cGF0aCBkPSJNMTguOTIgNi4wMUMxOC43MiA1LjQyIDE4LjE2IDUgMTcuNSA1aC0xMWMtLjY2IDAtMS4yMi40Mi0xLjQyIDEuMDFMMy41IDE0aDJsMS41LTMuNWgxMGwxLjUgMy41aDJ6bS0xMSAxaDhsLS43NSAxLjVINy45MnoiLz4KPC9zdmc+Cjwvc3ZnPgo8L2NpcmNsZT4KPC9zdmc+';
                    case 'cabEconomy':
                    case 'cabPremium':
                        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMwMDdBRkYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IndoaXRlIj4KPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiPgo8cGF0aCBkPSJNMTguOTIgNi4wMUMxOC43MiA1LjQyIDE4LjE2IDUgMTcuNSA1aC0xMWMtLjY2IDAtMS4yMi40Mi0xLjQyIDEuMDFMMy41IDE0aDJsMS41LTMuNWgxMGwxLjUgMy41aDJ6bS0xMSAxaDhsLS43NSAxLjVINy45MnoiLz4KPC9zdmc+Cjwvc3ZnPgo8L2NpcmNsZT4KPC9zdmc+';
                    case 'pickup':
                        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM0Q0FGNTASCZ8KPC9zdmc+';
                    case 'drop':
                        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGRjM0MzQiLz4KPC9zdmc+';
                    default:
                        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiNGRjM0MzQiLz4KPC9zdmc+';
                }
            }
            
            function updateDirections() {
                if (${showDirections} && ${JSON.stringify(directionsConfig)}) {
                    const config = ${JSON.stringify(directionsConfig)};
                    if (config && config.origin && config.destination) {
                        directionsService.route({
                            origin: config.origin,
                            destination: config.destination,
                            travelMode: google.maps.TravelMode.DRIVING
                        }, (result, status) => {
                            if (status === 'OK') {
                                directionsRenderer.setDirections(result);
                            }
                        });
                    }
                }
            }
            
            function updatePolyline() {
                if (polyline) {
                    polyline.setMap(null);
                }
                
                if (${showPolyline}) {
                    const coordinates = ${JSON.stringify(polylineCoordinates)};
                    const config = ${JSON.stringify(polylineConfig || {})};
                    
                    if (coordinates.length > 0) {
                        polyline = new google.maps.Polyline({
                            path: coordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude })),
                            geodesic: true,
                            strokeColor: config.strokeColor || '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: config.strokeWidth || 2
                        });
                        
                        polyline.setMap(map);
                    }
                }
            }
            
            // Listen for messages from React Native
            window.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'fitToCoordinates':
                        if (data.coordinates.length > 0) {
                            const bounds = new google.maps.LatLngBounds();
                            data.coordinates.forEach(coord => {
                                bounds.extend(new google.maps.LatLng(coord.latitude, coord.longitude));
                            });
                            map.fitBounds(bounds);
                            
                            // Add padding for better visibility
                            if (data.options && data.options.edgePadding) {
                                map.panBy(0, 0); // Trigger a small pan to apply bounds
                            }
                        }
                        break;
                    case 'animateToRegion':
                        const center = { lat: data.region.latitude, lng: data.region.longitude };
                        map.setCenter(center);
                        if (data.region.zoom) {
                            map.setZoom(data.region.zoom);
                        } else {
                            // Calculate zoom based on latitudeDelta
                            const zoom = Math.round(Math.log(360 / data.region.latitudeDelta) / Math.LN2);
                            map.setZoom(Math.min(Math.max(zoom, 10), 18));
                        }
                        break;
                    case 'getCurrentLocation':
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((position) => {
                                const userLocation = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                };
                                
                                map.setCenter(userLocation);
                                map.setZoom(16);
                                
                                // Update user location marker
                                if (userLocationMarker) {
                                    userLocationMarker.setPosition(userLocation);
                                } else {
                                    userLocationMarker = new google.maps.Marker({
                                        position: userLocation,
                                        map: map,
                                        icon: {
                                            path: google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: '#4285F4',
                                            fillOpacity: 1,
                                            strokeColor: '#ffffff',
                                            strokeWeight: 2
                                        }
                                    });
                                }
                                
                                // Send location back to React Native
                                window.ReactNativeWebView?.postMessage(JSON.stringify({
                                    type: 'currentLocationFound',
                                    location: {
                                        latitude: position.coords.latitude,
                                        longitude: position.coords.longitude
                                    }
                                }));
                            }, (error) => {
                                window.ReactNativeWebView?.postMessage(JSON.stringify({
                                    type: 'locationError',
                                    error: error.message
                                }));
                            });
                        }
                        break;
                    case 'animateToCoordinate':
                        const coord = { lat: data.coordinate.latitude, lng: data.coordinate.longitude };
                        map.panTo(coord);
                        break;
                    case 'startLiveTracking':
                        startLiveTracking();
                        break;
                    case 'stopLiveTracking':
                        stopLiveTracking();
                        break;
                }
            });
            
            function startLiveTracking() {
                if (navigator.geolocation && !liveTrackingWatchId) {
                    liveTrackingWatchId = navigator.geolocation.watchPosition(
                        (position) => {
                            const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            
                            // Update user location marker
                            if (userLocationMarker) {
                                userLocationMarker.setPosition(userLocation);
                            } else {
                                userLocationMarker = new google.maps.Marker({
                                    position: userLocation,
                                    map: map,
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 8,
                                        fillColor: '#4285F4',
                                        fillOpacity: 1,
                                        strokeColor: '#ffffff',
                                        strokeWeight: 2
                                    }
                                });
                            }
                            
                            // Send location update to React Native
                            window.ReactNativeWebView?.postMessage(JSON.stringify({
                                type: 'liveLocationUpdate',
                                location: {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                }
                            }));
                        },
                        (error) => {
                            console.error('Live tracking error:', error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 5000
                        }
                    );
                }
            }
            
            function stopLiveTracking() {
                if (liveTrackingWatchId) {
                    navigator.geolocation.clearWatch(liveTrackingWatchId);
                    liveTrackingWatchId = null;
                }
            }
        </script>
        <script async defer src="https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_MAP_API_KEY}&callback=initMap"></script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewMap;

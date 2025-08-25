import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import React, { FC, memo, useEffect, useRef, useState, useCallback } from "react";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import * as Location from 'expo-location';
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import CustomText from "../shared/CustomText";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";
import MapViewDirections from "react-native-maps-directions";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { getPoints } from "@/utils/mapUtils";

const apikey = process.env.EXPO_PUBLIC_MAP_API_KEY || "";

const RiderLiveTracking: FC<{
  drop: any;
  pickup: any;
  rider: any;
  status: string;
}> = ({ drop, status, pickup, rider }) => {
  const mapRef = useRef<MapView>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const regionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fitToMarkers = useCallback(async () => {
    if (isUserInteracting) return;

    const coordinates = [];

    // Always include current location if available
    if (currentLocation?.coords) {
      coordinates.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }

    if (pickup?.latitude && pickup?.longitude && status === "START") {
      coordinates.push({
        latitude: pickup.latitude,
        longitude: pickup.longitude,
      });
    }

    if (drop?.latitude && drop?.longitude && status === "ARRIVED") {
      coordinates.push({ latitude: drop.latitude, longitude: drop.longitude });
    }

    if (rider?.latitude && rider?.longitude) {
      coordinates.push({
        latitude: rider.latitude,
        longitude: rider.longitude,
      });
    }

    if (coordinates.length === 0) return;

    try {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 100, bottom: 200, left: 100 }, // More padding, especially bottom
        animated: true,
      });
    } catch (error) {
      console.error("Error fitting to markers:", error);
    }
  }, [isUserInteracting, currentLocation, pickup, drop, rider, status]);

  const fitToMarkersWithDelay = () => {
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  };

  const calculateInitialRegion = useCallback(() => {
    // Calculate region that includes all relevant points
    const points = [];
    
    if (currentLocation?.coords) {
      points.push({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    }
    
    if (pickup?.latitude && pickup?.longitude) {
      points.push({ latitude: pickup.latitude, longitude: pickup.longitude });
    }
    
    if (drop?.latitude && drop?.longitude) {
      points.push({ latitude: drop.latitude, longitude: drop.longitude });
    }
    
    if (rider?.latitude && rider?.longitude) {
      points.push({ latitude: rider.latitude, longitude: rider.longitude });
    }
    
    if (points.length > 1) {
      // Calculate bounds to fit all points
      const latitudes = points.map(p => p.latitude);
      const longitudes = points.map(p => p.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02); // Minimum zoom with padding
      const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.02);
      
      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }
    
    if (points.length === 1) {
      return {
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    
    return initialRegion;
  }, [currentLocation, pickup, drop, rider]);

  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for live tracking.');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          setCurrentLocation(location);
          
          // Auto-center map on location if user is not interacting
          // Use a broader view to show more context
          if (!isUserInteracting && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.02, // Broader view
              longitudeDelta: 0.02,
            }, 1500);
          }
        }
      );
      
      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking.');
    }
  }, [isUserInteracting]);

  const stopLocationTracking = useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  }, [locationSubscription]);

  const handleRegionChange = useCallback((region: Region) => {
    setIsUserInteracting(true);
    
    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    // Set timeout to reset interaction state after 3 seconds
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 3000);
  }, []);

  const handleRegionChangeComplete = useCallback(() => {
    // Debounce region change complete
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }
    
    regionChangeTimeoutRef.current = setTimeout(() => {
      // Additional logic can be added here if needed
    }, 500);
  }, []);

  const centerOnCurrentLocation = useCallback(() => {
    if (currentLocation?.coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.02, // Broader view for manual centering
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [currentLocation]);

  useEffect(() => {
    startLocationTracking();
    
    return () => {
      stopLocationTracking();
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pickup?.latitude && drop?.latitude) {
      fitToMarkers();
    }
  }, [fitToMarkers, drop?.latitude, pickup?.latitude, rider.latitude]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        followsUserLocation={false}
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        showsMyLocationButton={false}
        showsCompass={false}
        showsIndoors={false}
        customMapStyle={customMapStyle}
        showsUserLocation={true}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsTraffic={false}
        showsBuildings={false}
        showsPointsOfInterest={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        {/* Current location marker (blue dot) */}
        {currentLocation?.coords && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={4}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#007AFF',
              borderWidth: 3,
              borderColor: 'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            }} />
          </Marker>
        )}

        {rider?.latitude && pickup?.latitude && (
          <MapViewDirections
            origin={status === "START" ? pickup : rider}
            destination={status === "START" ? rider : drop}
            onReady={fitToMarkersWithDelay}
            apikey={apikey}
            strokeColor={Colors.iosColor}
            strokeColors={[Colors.iosColor]}
            strokeWidth={5}
            precision="low"
            onError={(error) => console.log("Directions error:", error)}
          />
        )}

        {drop?.latitude && (
          <Marker
            coordinate={{ latitude: drop.latitude, longitude: drop.longitude }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={1}
          >
            <Image
              source={require("@/assets/icons/drop_marker.png")}
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </Marker>
        )}

        {pickup?.latitude && (
          <Marker
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={2}
          >
            <Image
              source={require("@/assets/icons/marker.png")}
              style={{ height: 30, width: 30, resizeMode: "contain" }}
            />
          </Marker>
        )}

        {rider?.latitude && (
          <Marker
            coordinate={{
              latitude: rider.latitude,
              longitude: rider.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={3}
          >
            <View style={{ transform: [{ rotate: `${rider?.heading}deg` }] }}>
              <Image
                source={require("@/assets/icons/cab_marker.png")}
                style={{ height: 40, width: 40, resizeMode: "contain" }}
              />
            </View>
          </Marker>
        )}

        {drop && pickup && (
          <Polyline
            coordinates={getPoints([drop, pickup])}
            strokeColor={Colors.text}
            strokeWidth={2}
            geodesic={true}
            lineDashPattern={[12, 10]}
          />
        )}
      </MapView>

      <TouchableOpacity 
        style={mapStyles.gpsLiveButton} 
        onPress={centerOnCurrentLocation}
      >
        <CustomText fontFamily="SemiBold" fontSize={10}>
          Center on Me
        </CustomText>
        <FontAwesome6 name="location-arrow" size={RFValue(12)} color="#000" />
      </TouchableOpacity>

      <TouchableOpacity style={mapStyles.gpsButton} onPress={fitToMarkers}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>

      {/* Live tracking indicator */}
      {currentLocation && (
        <View style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: '#007AFF',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 15,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#00FF00',
            marginRight: 6,
          }} />
          <CustomText fontFamily="Medium" fontSize={10} style={{ color: 'white' }}>
            Live Tracking
          </CustomText>
        </View>
      )}
    </View>
  );
};

export default memo(RiderLiveTracking);

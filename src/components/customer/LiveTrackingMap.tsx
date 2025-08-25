import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { FC, memo, useEffect, useRef, useState, useCallback } from "react";
import WebViewMap, { WebViewMapRef } from "@/components/shared/WebViewMap";
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import { Colors } from "@/utils/Constants";
import { getPoints } from "@/utils/mapUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";
import CustomText from "@/components/shared/CustomText";


const LiveTrackingMap: FC<{
  height: number;
  drop: any;
  pickup: any;
  rider: any;
  status: string;
}> = ({ drop, status, height, pickup, rider }) => {
  const mapRef = useRef<WebViewMapRef>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fitToMarkers = useCallback(async () => {
    if (isUserInteracting || isMapLoading || mapError) return;

    const coordinates = [];

    // Validate and add pickup coordinates
    if (isValidCoordinate(pickup?.latitude, pickup?.longitude)) {
      coordinates.push({
        latitude: pickup.latitude,
        longitude: pickup.longitude,
      });
    }

    // Validate and add drop coordinates
    if (isValidCoordinate(drop?.latitude, drop?.longitude)) {
      coordinates.push({ 
        latitude: drop.latitude, 
        longitude: drop.longitude 
      });
    }

    // Validate and add rider coordinates
    if (isValidCoordinate(rider?.latitude, rider?.longitude)) {
      coordinates.push({
        latitude: rider.latitude,
        longitude: rider.longitude,
      });
    }

    if (coordinates.length === 0) {
      console.warn('No valid coordinates to fit to');
      return;
    }

    try {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error("Error fitting to markers:", error);
    }
  }, [isUserInteracting, isMapLoading, mapError, pickup, drop, rider]);

  const isValidCoordinate = (lat: any, lng: any): boolean => {
    return typeof lat === 'number' && typeof lng === 'number' && 
           !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  };

  const calculateInitialRegion = useCallback(() => {
    // Try pickup and drop first
    if (isValidCoordinate(pickup?.latitude, pickup?.longitude) && 
        isValidCoordinate(drop?.latitude, drop?.longitude)) {
      const latitude = (pickup.latitude + drop.latitude) / 2;
      const longitude = (pickup.longitude + drop.longitude) / 2;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    
    // Try pickup only
    if (isValidCoordinate(pickup?.latitude, pickup?.longitude)) {
      return {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Try drop only
    if (isValidCoordinate(drop?.latitude, drop?.longitude)) {
      return {
        latitude: drop.latitude,
        longitude: drop.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Fallback to initial region
    return initialRegion;
  }, [pickup, drop]);

  const handleLocationUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    console.log('Live location update received:', location);
    // Handle live location updates if needed
  }, []);

  const handlePinLocationSelect = useCallback((pinLocation: any) => {
    console.log('Pin location selected in live tracking:', pinLocation);
    setSelectedDestination(pinLocation);
    
    // Show destination selection info
    alert(`Selected destination: ${pinLocation.name}\nCategory: ${pinLocation.category}\nAddress: ${pinLocation.address}`);
  }, []);

  const handleRegionChange = useCallback(() => {
    setIsUserInteracting(true);
    
    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    
    // Set new timeout to reset interaction state after 3 seconds
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 3000);
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoading(false);
    setMapError(false);
    // Fit to markers after map loads
    setTimeout(() => {
      fitToMarkers();
    }, 1000);
  }, [fitToMarkers]);

  const handleMapError = useCallback(() => {
    setIsMapLoading(false);
    setMapError(true);
  }, []);

  useEffect(() => {
    if (!isMapLoading && !mapError) {
      const timeoutId = setTimeout(() => {
        fitToMarkers();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [drop?.latitude, pickup?.latitude, rider?.latitude, isMapLoading, mapError, fitToMarkers]);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  if (mapError) {
    return (
      <View style={{ height: height, width: "100%", justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <MaterialCommunityIcons name="map-marker-off" size={RFValue(40)} color="#ccc" />
        <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Map failed to load</CustomText>
        <TouchableOpacity 
          style={{ marginTop: 10, padding: 10, backgroundColor: Colors.iosColor, borderRadius: 5 }}
          onPress={() => {
            setMapError(false);
            setIsMapLoading(true);
          }}
        >
          <CustomText fontSize={12} style={{ color: 'white' }}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ height: height, width: "100%" }}>
      {isMapLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <ActivityIndicator size="large" color={Colors.iosColor} />
          <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Loading map...</CustomText>
        </View>
      )}
      
      <WebViewMap
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        markers={[
          ...(isValidCoordinate(pickup?.latitude, pickup?.longitude) ? [{
            id: 'pickup',
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            type: 'pickup',
            title: 'Pickup Location'
          }] : []),
          ...(isValidCoordinate(drop?.latitude, drop?.longitude) ? [{
            id: 'drop',
            latitude: drop.latitude,
            longitude: drop.longitude,
            type: 'drop',
            title: 'Drop Location'
          }] : []),
          ...(isValidCoordinate(rider?.latitude, rider?.longitude) ? [{
            id: 'rider',
            latitude: rider.latitude,
            longitude: rider.longitude,
            type: 'Cab',
            rotation: rider.heading || 0,
            title: 'Driver'
          }] : [])
        ]}
        showUserLocation={true}
        enableLiveTracking={true}
        showDirections={isValidCoordinate(rider?.latitude, rider?.longitude) && isValidCoordinate(pickup?.latitude, pickup?.longitude)}
        directionsConfig={isValidCoordinate(rider?.latitude, rider?.longitude) && isValidCoordinate(pickup?.latitude, pickup?.longitude) ? {
          origin: rider,
          destination: status === "START" ? pickup : drop,
          strokeColor: Colors.iosColor,
          strokeWidth: 5
        } : undefined}
        showPolyline={isValidCoordinate(drop?.latitude, drop?.longitude) && isValidCoordinate(pickup?.latitude, pickup?.longitude)}
        polylineCoordinates={isValidCoordinate(drop?.latitude, drop?.longitude) && isValidCoordinate(pickup?.latitude, pickup?.longitude) ? getPoints([drop, pickup]) : []}
        polylineConfig={{
          strokeColor: Colors.text,
          strokeWidth: 2,
          strokePattern: [12, 10]
        }}
        customMapStyle={customMapStyle}
        showPinLocations={true}
        onRegionChange={handleRegionChange}
        onLoad={handleMapLoad}
        onError={handleMapError}
        onLocationUpdate={handleLocationUpdate}
        onPinLocationSelect={handlePinLocationSelect}
      />

      {!isMapLoading && !mapError && (
        <TouchableOpacity style={mapStyles.gpsButton} onPress={fitToMarkers}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={RFValue(16)}
            color="#3C75BE"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default memo(LiveTrackingMap);

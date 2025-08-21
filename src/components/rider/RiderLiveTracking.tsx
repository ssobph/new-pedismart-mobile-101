import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { FC, memo, useEffect, useRef, useState, useCallback } from "react";
import WebViewMap, { WebViewMapRef } from "@/components/shared/WebViewMap";
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import CustomText from "../shared/CustomText";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";
import { Colors } from "@/utils/Constants";
import { getPoints } from "@/utils/mapUtils";

const apikey = process.env.EXPO_PUBLIC_MAP_API_KEY || "";

const RiderLiveTracking: FC<{
  drop: any;
  pickup: any;
  rider: any;
  status: string;
}> = ({ drop, status, pickup, rider }) => {
  const mapRef = useRef<WebViewMapRef>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fitToMarkers = useCallback(async () => {
    if (isUserInteracting) return;

    const coordinates = [];

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
      mapRef.current?.fitToCoordinates(coordinates);
    } catch (error) {
      console.error("Error fitting to markers:", error);
    }
  }, [isUserInteracting, pickup, drop, rider, status]);

  const fitToMarkersWithDelay = useCallback(() => {
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  }, [fitToMarkers]);

  const handleLocationUpdate = useCallback((location: any) => {
    setUserLocation(location);
    if (!isUserInteracting) {
      mapRef.current?.animateToCoordinate({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [isUserInteracting]);

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

  const calculateInitialRegion = () => {
    if (pickup?.latitude && drop?.latitude) {
      const latitude = (pickup.latitude + drop.latitude) / 2;
      const longitude = (pickup.longitude + drop.longitude) / 2;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return initialRegion;
  };

  useEffect(() => {
    if (pickup?.latitude && drop?.latitude) fitToMarkers();
  }, [drop?.latitude, pickup?.latitude, rider?.latitude, fitToMarkers]);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <WebViewMap
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        markers={[
          ...(pickup?.latitude ? [{
            id: 'pickup',
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            type: 'pickup',
            title: 'Pickup Location'
          }] : []),
          ...(drop?.latitude ? [{
            id: 'drop',
            latitude: drop.latitude,
            longitude: drop.longitude,
            type: 'drop',
            title: 'Drop Location'
          }] : []),
          ...(rider?.latitude ? [{
            id: 'rider',
            latitude: rider.latitude,
            longitude: rider.longitude,
            type: 'cabEconomy',
            rotation: rider.heading,
            title: 'Driver'
          }] : [])
        ]}
        showUserLocation={true}
        enableLiveTracking={true}
        onLocationUpdate={handleLocationUpdate}
        showDirections={rider?.latitude && pickup?.latitude}
        directionsConfig={rider?.latitude && pickup?.latitude ? {
          origin: status === "START" ? pickup : rider,
          destination: status === "START" ? rider : drop,
          strokeColor: Colors.iosColor,
          strokeWidth: 5
        } : undefined}
        showPolyline={drop && pickup}
        polylineCoordinates={drop && pickup ? getPoints([drop, pickup]) : []}
        polylineConfig={{
          strokeColor: Colors.text,
          strokeWidth: 2,
          strokePattern: [12, 10]
        }}
        customMapStyle={customMapStyle}
        onRegionChange={handleRegionChange}
      />

      <TouchableOpacity style={mapStyles.gpsLiveButton} onPress={() => {}}>
        <CustomText fontFamily="SemiBold" fontSize={10}>
          Open Live GPS
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
    </View>
  );
};

export default memo(RiderLiveTracking);

import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import WebViewMap, { WebViewMapRef } from "@/components/shared/WebViewMap";
import { useUserStore } from "@/store/userStore";
import { useWS } from "@/service/WSProvider";
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import { reverseGeocode } from "@/utils/mapUtils";
import haversine from "haversine-distance";
import { mapStyles } from "@/styles/mapStyles";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import * as Location from "expo-location";
import DriverDetailsModal from "./DriverDetailsModal";

const DraggableMap: FC<{ height: number }> = ({ height }) => {
  const isFocused = useIsFocused();
  const [markers, setMarkers] = useState<any>([]);
  const mapRef = useRef<WebViewMapRef>(null);
  const { setLocation, location, outOfRange, setOutOfRange } = useUserStore();
  const { emit, on, off } = useWS();
  const MAX_DISTANCE_THRESHOLD = 10000;
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [driverModalVisible, setDriverModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (isFocused) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            mapRef.current?.fitToCoordinates([{ latitude, longitude }]);
            const newRegion = {
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            handleRegionChangeComplete(newRegion);
          } catch (error) {
            console.error("Error getting current location:", error);
          }
        } else {
          console.log("Permission to access location was denied");
        }
      }
    })();
  }, [mapRef, isFocused]);

  useEffect(() => {
    if (location?.latitude && location?.longitude && isFocused) {
      emit("subscribeToZone", {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      on("nearbyriders", (riders: any[]) => {
        const updatedMarkers = riders.map((rider) => ({
          id: rider.socketId,
          riderId: rider.riderId,
          latitude: rider.coords.latitude,
          longitude: rider.coords.longitude,
          type: rider.vehicleType || "auto", // Use vehicle type if available
          rotation: rider.coords.heading || 0,
          visible: true,
          driverInfo: rider.driverInfo || null,
        }));
        setMarkers(updatedMarkers);
      });
    }

    return () => {
      off("nearbyriders");
    };
  }, [location, emit, on, off, isFocused]);

  const handleRegionChangeComplete = async (newRegion: any) => {
    const address = await reverseGeocode(
      newRegion.latitude,
      newRegion.longitude
    );
    setLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
      address: address,
    });

    const userLocation = {
      latitude: location?.latitude,
      longitude: location?.longitude,
    } as any;
    if (userLocation) {
      const newLocation = {
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      };
      const distance = haversine(userLocation, newLocation);
      setOutOfRange(distance > MAX_DISTANCE_THRESHOLD);
    }
  };

  const handleGpsButtonPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        mapRef.current?.getCurrentLocation();
      } else {
        console.log("Location permission denied");
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handleMarkerPress = (marker: any) => {
    if (marker.riderId) {
      // Fetch driver details
      emit("getDriverDetails", { riderId: marker.riderId });
      
      // Listen for driver details response
      on("driverDetailsResponse", (driverDetails: any) => {
        setSelectedDriver({
          ...driverDetails,
          vehicleType: marker.type,
        });
        setDriverModalVisible(true);
        
        // Remove the listener after receiving the response
        off("driverDetailsResponse");
      });
    }
  };

  const closeDriverModal = () => {
    setDriverModalVisible(false);
    setSelectedDriver(null);
  };

  return (
    <View style={{ height: height, width: "100%" }}>
      <WebViewMap
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        markers={markers
          ?.filter(
            (marker: any) =>
              marker?.latitude && marker.longitude && marker.visible
          )
          .map((marker: any, index: number) => ({
            id: marker.id || index.toString(),
            latitude: marker.latitude,
            longitude: marker.longitude,
            type: marker.type,
            rotation: marker.rotation,
            title: marker.driverInfo?.name || `Driver ${index + 1}`
          }))}
        showUserLocation={true}
        onRegionChange={handleRegionChangeComplete}
        onMarkerPress={handleMarkerPress}
        customMapStyle={customMapStyle}
      />

      <View style={mapStyles.centerMarkerContainer}>
        <Image
          source={require("@/assets/icons/marker.png")}
          style={mapStyles.marker}
        />
      </View>
      <TouchableOpacity
        style={mapStyles.gpsButton}
        onPress={handleGpsButtonPress}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={RFValue(16)}
          color="#3C75BE"
        />
      </TouchableOpacity>

      {outOfRange && (
        <View style={mapStyles.outOfRange}>
          <FontAwesome6 name="road-circle-exclamation" size={24} color="red" />
        </View>
      )}

      <DriverDetailsModal
        visible={driverModalVisible}
        driverDetails={selectedDriver}
        onClose={closeDriverModal}
      />
    </View>
  );
};

export default memo(DraggableMap);

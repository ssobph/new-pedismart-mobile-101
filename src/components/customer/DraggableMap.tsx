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
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            // Fallback to default location (Manila, Philippines) for testing
            const fallbackRegion = {
              latitude: 14.5995,
              longitude: 120.9842,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            console.log("Using fallback location:", fallbackRegion);
            handleRegionChangeComplete(fallbackRegion);
          }
        } else {
          console.log("Permission to access location was denied");
          // Fallback to default location for testing
          const fallbackRegion = {
            latitude: 14.5995,
            longitude: 120.9842,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          console.log("Using fallback location due to permission denial:", fallbackRegion);
          handleRegionChangeComplete(fallbackRegion);
        }
      }
    })();
  }, [mapRef, isFocused]);

  useEffect(() => {
    console.log('DraggableMap location effect triggered:', { location, isFocused });
    
    if (location?.latitude && location?.longitude && isFocused) {
      console.log('Emitting subscribeToZone with:', {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      
      emit("subscribeToZone", {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      on("nearbyriders", (riders: any[]) => {
        console.log('Received nearby riders:', riders); // Debug log
        console.log('Raw rider data:', JSON.stringify(riders, null, 2));
        
        const updatedMarkers = riders.map((rider) => {
          const marker = {
            id: rider.socketId || rider.riderId || Math.random().toString(),
            riderId: rider.riderId,
            latitude: rider.coords?.latitude || rider.latitude,
            longitude: rider.coords?.longitude || rider.longitude,
            vehicleType: rider.vehicleType || "Tricycle", // Use vehicleType from server
            type: rider.vehicleType || rider.type || "auto", // Keep for backward compatibility
            rotation: rider.coords?.heading || rider.heading || 0,
            visible: true,
            driverInfo: rider.driverInfo || rider,
          };
          console.log('Processed marker:', marker);
          return marker;
        });
        
        console.log('Updated markers array:', updatedMarkers);
        console.log('Setting markers with count:', updatedMarkers.length);
        setMarkers(updatedMarkers);
      });
    } else {
      console.log('Not subscribing to zone - missing location or not focused');
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
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      } else {
        console.log("Location permission denied");
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handleMarkerPress = (marker: any) => {
    console.log('Marker pressed:', marker); // Debug log
    
    if (marker.riderId || marker.id) {
      const riderId = marker.riderId || marker.id;
      console.log('Fetching driver details for riderId:', riderId); // Debug log
      
      // Clear any existing timeout
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      
      // Fetch driver details
      emit("getDriverDetails", { riderId });
      
      // Set up one-time listener for driver details response
      const handleDriverDetailsResponse = (driverDetails: any) => {
        console.log('Received driver details:', driverDetails); // Debug log
        
        // Clear fallback timeout since we got response
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
        }
        
        setSelectedDriver({
          ...driverDetails,
          vehicleType: driverDetails.vehicleType || marker.vehicleType || marker.type || 'Tricycle',
          riderId: riderId,
        });
        setDriverModalVisible(true);
        
        // Remove the listener after receiving the response
        off("driverDetailsResponse");
      };
      
      on("driverDetailsResponse", handleDriverDetailsResponse);
      
      // Fallback: If no WebSocket response, show basic info
      fallbackTimeoutRef.current = setTimeout(() => {
        console.log('No WebSocket response, showing basic info'); // Debug log
        setSelectedDriver({
          firstName: marker.title || 'Driver',
          lastName: '',
          phone: 'Not available',
          vehicleType: marker.type || 'auto',
          riderId: riderId,
          _id: riderId,
        });
        setDriverModalVisible(true);
        off("driverDetailsResponse"); // Clean up listener
      }, 3000); // 3 second timeout
    } else {
      console.log('No riderId found in marker:', marker); // Debug log
    }
  };

  const closeDriverModal = () => {
    setDriverModalVisible(false);
    setSelectedDriver(null);
    // Clean up any remaining listeners and timeouts
    off("driverDetailsResponse");
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  };

  const handlePinLocationSelect = (pinLocation: any) => {
    console.log('Pin location selected for destination:', pinLocation);
    setSelectedDestination(pinLocation);
    
    // You can add additional logic here to handle the destination selection
    // For example, setting it as the drop location in a booking flow
    alert(`Selected destination: ${pinLocation.name}\nCategory: ${pinLocation.category}\nAddress: ${pinLocation.address}`);
  };


  return (
    <View style={{ height: height, width: "100%" }}>
      <WebViewMap
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        markers={(() => {
          const filteredMarkers = markers
            ?.filter(
              (marker: any) =>
                marker?.latitude && marker.longitude
            )
            .map((marker: any, index: number) => ({
              id: marker.id || index.toString(),
              riderId: marker.riderId, // Preserve riderId for modal
              latitude: marker.latitude,
              longitude: marker.longitude,
              rotation: marker.rotation || 0,
              vehicleType: marker.vehicleType || 'Tricycle', // Pass vehicleType to WebViewMap
              type: marker.type || 'auto', // Keep for backward compatibility
              title: marker.driverInfo?.name || `Driver ${index + 1}`,
              icon: marker.vehicleType || marker.type || 'auto',
              driverInfo: marker.driverInfo // Preserve driver info
            }));
          
          console.log('Final markers passed to WebViewMap:', filteredMarkers);
          console.log('Markers count being passed:', filteredMarkers?.length || 0);
          return filteredMarkers;
        })()}
        showUserLocation={true}
        showPinLocations={true}
        customMapStyle={customMapStyle}
        onRegionChange={handleRegionChangeComplete}
        onMarkerPress={handleMarkerPress}
        onPinLocationSelect={handlePinLocationSelect}
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

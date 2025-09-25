import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
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

  const fitToMarkers = async () => {
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
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error("Error fitting to markers:", error);
    }
  };

  const fitToMarkersWithDelay = () => {
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  };

  const calculateInitialRegion = () => {
    // If we have rider location, center on rider
    if (rider?.latitude && rider?.longitude) {
      return {
        latitude: rider.latitude,
        longitude: rider.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    // Otherwise center between pickup and drop
    if (pickup?.latitude && pickup?.longitude && drop?.latitude && drop?.longitude) {
      const latitude = (pickup.latitude + drop.latitude) / 2;
      const longitude = (pickup.longitude + drop.longitude) / 2;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    // Fallback to pickup location
    if (pickup?.latitude && pickup?.longitude) {
      return {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return indiaIntialRegion;
  };

  useEffect(() => {
    if (pickup?.latitude && pickup?.longitude && drop?.latitude && drop?.longitude) {
      fitToMarkers();
    }
  }, [drop?.latitude, pickup?.latitude, rider?.latitude]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        followsUserLocation
        style={{ flex: 1 }}
        initialRegion={calculateInitialRegion()}
        showsMyLocationButton={false}
        showsCompass={true}
        showsIndoors={false}
        showsUserLocation={true}
        showsTraffic={false}
        showsBuildings={true}
        showsPointsOfInterest={true}
        mapType="standard"
        onRegionChange={() => setIsUserInteracting(true)}
        onRegionChangeComplete={() => setIsUserInteracting(false)}
        onMapReady={() => {
          console.log("Map is ready");
          setTimeout(() => fitToMarkers(), 1000);
        }}
      >
        {apikey && rider?.latitude && rider?.longitude && pickup?.latitude && pickup?.longitude && drop?.latitude && drop?.longitude && (
          <MapViewDirections
            origin={status === "START" ? pickup : rider}
            destination={status === "START" ? rider : drop}
            onReady={fitToMarkersWithDelay}
            apikey={apikey}
            strokeColor="#4285F4"
            strokeWidth={4}
            precision="high"
            optimizeWaypoints={true}
            onError={(error) => {
              console.log("Directions error:", error);
              // Fallback to simple polyline if directions fail
            }}
          />
        )}

        {drop?.latitude && drop?.longitude && (
          <Marker
            coordinate={{ latitude: drop.latitude, longitude: drop.longitude }}
            title="Drop Location"
            description="Destination"
            anchor={{ x: 0.5, y: 1 }}
            zIndex={1}
          >
            <View style={{
              backgroundColor: '#ff4444',
              padding: 8,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: 'white',
            }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>DROP</Text>
            </View>
          </Marker>
        )}

        {pickup?.latitude && pickup?.longitude && (
          <Marker
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            title="Pickup Location"
            description="Starting point"
            anchor={{ x: 0.5, y: 1 }}
            zIndex={2}
          >
            <View style={{
              backgroundColor: '#4CAF50',
              padding: 8,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: 'white',
            }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>PICKUP</Text>
            </View>
          </Marker>
        )}

        {rider?.latitude && rider?.longitude && (
          <Marker
            coordinate={{
              latitude: rider.latitude,
              longitude: rider.longitude,
            }}
            title="Your Location"
            description="Rider position"
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={3}
          >
            <View style={{ 
              transform: [{ rotate: `${rider?.heading || 0}deg` }],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                backgroundColor: '#2196F3',
                padding: 10,
                borderRadius: 25,
                borderWidth: 3,
                borderColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>🏍️</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Fallback polyline when directions API fails or unavailable */}
        {!apikey && drop?.latitude && drop?.longitude && pickup?.latitude && pickup?.longitude && (
          <Polyline
            coordinates={[
              { latitude: pickup.latitude, longitude: pickup.longitude },
              { latitude: drop.latitude, longitude: drop.longitude }
            ]}
            strokeColor="#FF6B35"
            strokeWidth={3}
            geodesic={true}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

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

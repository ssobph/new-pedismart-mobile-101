import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { FC, memo, useEffect, useRef } from "react";
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import WebViewMap, { WebViewMapRef } from "@/components/shared/WebViewMap";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { mapStyles } from "@/styles/mapStyles";


const RoutesMap: FC<{ drop: any; pickup: any }> = ({ drop, pickup }) => {
  const mapRef = useRef<WebViewMapRef>(null);

  const fitToMarkers = async () => {
    const coordinates = [];

    if (pickup?.latitude && pickup?.longitude) {
      coordinates.push({
        latitude: pickup?.latitude,
        longitude: pickup?.longitude,
      });
    }
    if (drop?.latitude && drop?.longitude) {
      coordinates.push({
        latitude: drop?.latitude,
        longitude: drop?.longitude,
      });
    }

    if (coordinates.length === 0) return;

    try {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.log("Error fitting");
    }
  };

  const fitToMarkersWithDelay = () => {
    setTimeout(() => {
      fitToMarkers();
    }, 500);
  };

  useEffect(() => {
    if (drop?.latitude && pickup?.latitude && mapRef) {
      fitToMarkersWithDelay();
    }
  }, [drop?.latitude, pickup?.latitude, mapRef]);

  const calculateInitialRegion = () => {
    if (pickup?.latitude && drop?.latitude) {
      const latitude = (pickup?.latitude + drop?.latitude) / 2;
      const longitude = (pickup?.longitude + drop?.longitude) / 2;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return initialRegion;
  };

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
          }] : [])
        ]}
        showUserLocation={true}
        showDirections={pickup?.latitude && drop?.latitude}
        directionsConfig={pickup?.latitude && drop?.latitude ? {
          origin: pickup,
          destination: drop,
          strokeColor: '#D2D2D2',
          strokeWidth: 5
        } : undefined}
        customMapStyle={customMapStyle}
      />

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

export default memo(RoutesMap);

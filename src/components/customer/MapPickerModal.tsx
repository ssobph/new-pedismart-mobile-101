import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import { modalStyles } from "@/styles/modalStyles";
import WebViewMap, { WebViewMapRef } from "@/components/shared/WebViewMap";
import { useUserStore } from "@/store/userStore";
import {
  getLatLong,
  getPlacesSuggestions,
  reverseGeocode,
} from "@/utils/mapUtils";
import LocationItem from "./LocationItem";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { customMapStyle, initialRegion } from "@/utils/CustomMap";
import { mapStyles } from "@/styles/mapStyles";

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  selectedLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onSelectLocation: (location: any) => void;
}

const MapPickerModal: FC<MapPickerModalProps> = ({
  visible,
  selectedLocation,
  onClose,
  title,
  onSelectLocation,
}) => {
  const mapRef = useRef<WebViewMapRef>(null);
  const [text, setText] = useState("");
  const { location } = useUserStore();
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<any>(null);
  const [locations, setLocations] = useState([]);
  const textInputRef = useRef<TextInput>(null);

  const fetchLocation = async (query: string) => {
    if (query?.length > 4) {
      const data = await getPlacesSuggestions(query);
      setLocations(data);
    } else {
      setLocations([]);
    }
  };

  useEffect(() => {
    if (selectedLocation?.latitude) {
      setAddress(selectedLocation?.address);
      setRegion({
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });

      mapRef?.current?.fitToCoordinates([
        {
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
        },
      ]);
    }
  }, [selectedLocation, mapRef]);

  const addLocation = async (place_id: string) => {
    const data = await getLatLong(place_id);
    if (data) {
      setRegion({
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
      setAddress(data.address);
    }
    textInputRef.current?.blur();
    setText("");
  };

  const renderLocations = ({ item }: any) => {
    return (
      <LocationItem item={item} onPress={() => addLocation(item?.place_id)} />
    );
  };

  const handleRegionChangeComplete = async (newRegion: any) => {
    try {
      // Only update if the region has changed significantly (more than ~10 meters)
      const threshold = 0.0001;
      if (region && 
          Math.abs(region.latitude - newRegion.latitude) < threshold &&
          Math.abs(region.longitude - newRegion.longitude) < threshold) {
        return; // Skip update if change is minimal
      }
      
      setRegion(newRegion);
      
      // Debounce address lookup to prevent excessive API calls
      const address = await reverseGeocode(
        newRegion?.latitude,
        newRegion?.longitude
      );
      setAddress(address);
    } catch (error) {
      console.log(error);
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

  return (
    <Modal
      animationType="slide"
      visible={visible}
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={modalStyles?.modalContainer}>
        <Text style={modalStyles?.centerText}>Select {title}</Text>

        <TouchableOpacity onPress={onClose}>
          <Text style={modalStyles?.cancelButton}>Cancel</Text>
        </TouchableOpacity>

        <View style={modalStyles.searchContainer}>
          <Ionicons name="search-outline" size={RFValue(16)} color="#777" />
          <TextInput
            ref={textInputRef}
            style={modalStyles?.input}
            placeholder="Search address"
            placeholderTextColor="#aaa"
            value={text}
            onChangeText={(e) => {
              setText(e);
              fetchLocation(e);
            }}
          />
        </View>

        {text !== "" ? (
          <FlatList
            ListHeaderComponent={
              <View>
                {text.length > 4 ? null : (
                  <Text style={{ marginHorizontal: 16 }}>
                    Enter at least 4 characters to search
                  </Text>
                )}
              </View>
            }
            data={locations}
            renderItem={renderLocations}
            keyExtractor={(item: any) => item.place_id}
            initialNumToRender={5}
            windowSize={5}
          />
        ) : (
          <>
            <View style={{ flex: 1, width: "100%" }}>
              <WebViewMap
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude:
                    region?.latitude ??
                    location?.latitude ??
                    initialRegion?.latitude,
                  longitude:
                    region?.longitude ??
                    location?.longitude ??
                    initialRegion?.longitude,
                  latitudeDelta: 0.5,
                  longitudeDelta: 0.5,
                }}
                showUserLocation={true}
                onRegionChange={handleRegionChangeComplete}
                customMapStyle={customMapStyle}
              />
              <View style={mapStyles.centerMarkerContainer}>
                <Image
                  source={
                    title == "drop"
                      ? require("@/assets/icons/drop_marker.png")
                      : require("@/assets/icons/marker.png")
                  }
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
            </View>

            <View style={modalStyles?.footerContainer}>
              <Text style={modalStyles.addressText} numberOfLines={2}>
                {address === "" ? "Getting address..." : address}
              </Text>
              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity
                  style={modalStyles.button}
                  onPress={() => {
                    onSelectLocation({
                      type: title,
                      latitude: region?.latitude,
                      longitude: region?.longitude,
                      address: address,
                    });
                    onClose();
                  }}
                >
                  <Text style={modalStyles.buttonText}>Set Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default memo(MapPickerModal);

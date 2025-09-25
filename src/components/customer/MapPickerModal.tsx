import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import React, { FC, memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import MapView from "react-native-maps";
import { modalStyles } from "@/styles/modalStyles";
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
import { customMapStyle, indiaIntialRegion } from "@/utils/CustomMap";
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
  const mapRef = useRef<MapView>(null);
  const [text, setText] = useState("");
  const { location } = useUserStore();
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<any>(null);
  const [locations, setLocations] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLocation = useCallback(async (query: string) => {
    if (query?.length > 3) {
      try {
        const data = await getPlacesSuggestions(query);
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      }
    } else {
      setLocations([]);
    }
  }, []);

  const debouncedFetchLocation = useCallback((query: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchLocation(query);
    }, 300);
  }, [fetchLocation]);

  useEffect(() => {
    if (selectedLocation?.latitude) {
      console.log('Setting selected location:', selectedLocation); // Debug log
      setAddress(selectedLocation?.address);
      const newRegion = {
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);

      // Animate to the selected location
      setTimeout(() => {
        mapRef?.current?.animateToRegion(newRegion, 1000);
      }, 500);
    } else {
      // Initialize with user's current location or default
      const defaultRegion = {
        latitude: location?.latitude ?? indiaIntialRegion?.latitude,
        longitude: location?.longitude ?? indiaIntialRegion?.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      console.log('Setting default region:', defaultRegion); // Debug log
      setRegion(defaultRegion);
    }
  }, [selectedLocation, location, mapRef]);

  const addLocation = useCallback(async (place_id: string) => {
    try {
      setIsLoadingAddress(true);
      const data = await getLatLong(place_id);
      if (data) {
        const newRegion = {
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setAddress(data.address);
        
        // Animate map to new location
        mapRef?.current?.fitToCoordinates([{
          latitude: data.latitude,
          longitude: data.longitude,
        }], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Error adding location:', error);
    } finally {
      setIsLoadingAddress(false);
      textInputRef.current?.blur();
      setText("");
      setLocations([]);
    }
  }, []);

  const renderLocations = ({ item }: any) => {
    return (
      <LocationItem item={item} onPress={() => addLocation(item?.place_id)} />
    );
  };

  const handleRegionChangeComplete = useCallback(async (newRegion: any) => {
    try {
      console.log('Region changed:', newRegion); // Debug log
      
      // Update region immediately for responsive UI
      setRegion(newRegion);
      setIsLoadingAddress(true);
      
      // Clear previous timeout
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
      
      // Debounce address lookup to prevent excessive API calls
      addressTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Getting address for:', newRegion.latitude, newRegion.longitude); // Debug log
          const address = await reverseGeocode(
            newRegion?.latitude,
            newRegion?.longitude
          );
          console.log('Address found:', address); // Debug log
          setAddress(address || "Address not found");
        } catch (error) {
          console.error('Error getting address:', error);
          setAddress("Unable to get address");
        } finally {
          setIsLoadingAddress(false);
        }
      }, 800); // Increased debounce time for better UX
    } catch (error) {
      console.error('Error in region change:', error);
      setIsLoadingAddress(false);
    }
  }, []);

  const handleRegionChange = useCallback(() => {
    // Show immediate feedback when user starts dragging
    if (!isLoadingAddress) {
      setAddress("Tap and drag to select location");
    }
  }, [isLoadingAddress]);

  const handleGpsButtonPress = useCallback(async () => {
    try {
      setIsLoadingAddress(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          const newRegion = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          
          setRegion(newRegion);
          mapRef.current?.fitToCoordinates([{
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
        }], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
        
        // Get address for current location
        const address = await reverseGeocode(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
        setAddress(address || "Current location");
        } catch (locationError) {
          console.log("Failed to get current location, using fallback:", locationError);
          // Use fallback location (Manila, Philippines)
          const fallbackRegion = {
            latitude: 14.5995,
            longitude: 120.9842,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(fallbackRegion);
          setAddress("Manila, Philippines (Fallback)");
        }
      } else {
        console.log("Location permission denied, using fallback");
        // Use fallback location
        const fallbackRegion = {
          latitude: 14.5995,
          longitude: 120.9842,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(fallbackRegion);
        setAddress("Manila, Philippines (Fallback)");
      }
    } catch (error) {
      console.log("Error getting location, using fallback:", error);
      // Use fallback location
      const fallbackRegion = {
        latitude: 14.5995,
        longitude: 120.9842,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(fallbackRegion);
      setAddress("Manila, Philippines (Fallback)");
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (addressTimeoutRef.current) {
        clearTimeout(addressTimeoutRef.current);
      }
    };
  }, []);

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
              debouncedFetchLocation(e);
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
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                region={region ? {
                  latitude: region.latitude,
                  longitude: region.longitude,
                  latitudeDelta: region.latitudeDelta || 0.01,
                  longitudeDelta: region.longitudeDelta || 0.01,
                } : {
                  latitude: location?.latitude ?? indiaIntialRegion?.latitude,
                  longitude: location?.longitude ?? indiaIntialRegion?.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsMyLocationButton={false}
                showsCompass={false}
                showsIndoors={false}
                showsIndoorLevelPicker={false}
                showsTraffic={false}
                showsScale={false}
                showsBuildings={false}
                showsPointsOfInterest={false}
                customMapStyle={customMapStyle}
                showsUserLocation={true}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
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
                {isLoadingAddress ? "Getting address..." : (address === "" ? "Tap and drag to select location" : address)}
              </Text>
              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    modalStyles.button,
                    (!region?.latitude || !region?.longitude || isLoadingAddress) && 
                    { backgroundColor: '#ccc' }
                  ]}
                  disabled={!region?.latitude || !region?.longitude || isLoadingAddress}
                  onPress={() => {
                    console.log('Set Address pressed:', { region, address }); // Debug log
                    if (region?.latitude && region?.longitude) {
                      onSelectLocation({
                        type: title,
                        latitude: region.latitude,
                        longitude: region.longitude,
                        address: address || "Selected location",
                      });
                      onClose();
                    }
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

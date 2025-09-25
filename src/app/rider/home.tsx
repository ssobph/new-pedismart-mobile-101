import { View, Text, FlatList, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useWS } from "@/service/WSProvider";
import { useRiderStore } from "@/store/riderStore";
import { getMyRides } from "@/service/rideService";
import * as Location from "expo-location";
import { homeStyles } from "@/styles/homeStyles";
import { StatusBar } from "expo-status-bar";
import RiderHeader from "@/components/rider/RiderHeader";
import { riderStyles } from "@/styles/riderStyles";
import CustomText from "@/components/shared/CustomText";
import RiderRidesItem from "@/components/rider/RiderRidesItem";
import OtpDisplayModal from "@/components/rider/OtpDisplayModal";

const RiderHome = () => {
  const isFocused = useIsFocused();
  const { emit, on, off } = useWS();
  const { onDuty, setLocation } = useRiderStore();

  const [rideOffers, setRideOffers] = useState<any[]>([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [acceptedRide, setAcceptedRide] = useState<any>(null);

  useEffect(() => {
    getMyRides(false);
  }, []);

  useEffect(() => {
    let locationsSubscription: any;
    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          // Check if location services are enabled
          const isLocationEnabled = await Location.hasServicesEnabledAsync();
          if (!isLocationEnabled) {
            console.log('Location services not enabled, using fallback location');
            // Use fallback location for Manila
            const fallbackLocation = {
              latitude: 14.5995,
              longitude: 120.9842,
              address: "Manila, Philippines (Fallback)",
              heading: 0,
            };
            setLocation(fallbackLocation);
            emit("updateLocation", {
              latitude: fallbackLocation.latitude,
              longitude: fallbackLocation.longitude,
              heading: fallbackLocation.heading,
            });
            return;
          }

          locationsSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced for better compatibility
              timeInterval: 10000,
              distanceInterval: 10,
            },
            (location) => {
              const { latitude, longitude, heading } = location.coords;
              setLocation({
                latitude: latitude,
                longitude: longitude,
                address: "Current Location",
                heading: heading as number,
              });
              emit("updateLocation", {
                latitude,
                longitude,
                heading,
              });
            }
          );
        } else {
          console.log('Location permission denied, using fallback location');
          // Use fallback location for Manila
          const fallbackLocation = {
            latitude: 14.5995,
            longitude: 120.9842,
            address: "Manila, Philippines (Fallback)",
            heading: 0,
          };
          setLocation(fallbackLocation);
          emit("updateLocation", {
            latitude: fallbackLocation.latitude,
            longitude: fallbackLocation.longitude,
            heading: fallbackLocation.heading,
          });
        }
      } catch (error) {
        console.log('Error with location services, using fallback:', error);
        // Use fallback location for Manila
        const fallbackLocation = {
          latitude: 14.5995,
          longitude: 120.9842,
          address: "Manila, Philippines (Fallback)",
          heading: 0,
        };
        setLocation(fallbackLocation);
        emit("updateLocation", {
          latitude: fallbackLocation.latitude,
          longitude: fallbackLocation.longitude,
          heading: fallbackLocation.heading,
        });
      }
    };

    if (onDuty && isFocused) {
      startLocationUpdates();
    }

    return () => {
      if (locationsSubscription) {
        locationsSubscription.remove();
      }
    };
  }, [onDuty, isFocused]);

  // Simple socket-only approach - more reliable than API calls
  const requestRidesViaSocket = () => {
    console.log("🔄 Requesting all searching rides via socket...");
    emit("requestAllSearchingRides");
  };

  useEffect(() => {
    if (onDuty && isFocused) {
      console.log("Rider going on duty - setting up ride listeners");
      
      // Immediately request all searching rides
      emit("requestAllSearchingRides");
      
      // Set up socket refresh every 3 seconds (reliable method)
      const socketRefreshInterval = setInterval(() => {
        requestRidesViaSocket();
      }, 3000);

      // Listen for ALL searching rides response
      on("allSearchingRides", (rides: any[]) => {
        console.log(`✅ Received ${rides?.length || 0} searching rides via socket`);
        setRideOffers(rides || []);
      });

      // Listen for new ride requests in real-time
      on("newRideRequest", (rideDetails: any) => {
        console.log("🆕 New ride request received:", rideDetails?._id);
        setRideOffers((prevOffers) => {
          const existingIds = new Set(prevOffers?.map((offer) => offer?._id));
          if (!existingIds.has(rideDetails?._id)) {
            console.log("Adding new ride to list");
            return [...prevOffers, rideDetails];
          }
          console.log("Ride already exists in list");
          return prevOffers;
        });
      });

      // Keep the old rideOffer listener for backward compatibility
      on("rideOffer", (rideDetails: any) => {
        console.log("📢 Ride offer received:", rideDetails?._id);
        setRideOffers((prevOffers) => {
          const existingIds = new Set(prevOffers?.map((offer) => offer?._id));
          if (!existingIds.has(rideDetails?._id)) {
            return [...prevOffers, rideDetails];
          }
          return prevOffers;
        });
      });

      // Listen for ride acceptance confirmation with OTP
      on("rideAccepted", (rideData: any) => {
        console.log("✅ Ride accepted with data:", rideData);
        if (typeof rideData === 'string') {
          removeRide(rideData);
        } else {
          setAcceptedRide(rideData);
          setShowOtpModal(true);
          removeRide(rideData._id);
        }
      });

      // Listen for ride cancellations
      on("rideOfferCanceled", (rideId: string) => {
        console.log("❌ Ride offer canceled:", rideId);
        removeRide(rideId);
      });

      on("rideOfferTimeout", (rideId: string) => {
        console.log("⏰ Ride offer timed out:", rideId);
        removeRide(rideId);
      });

      return () => {
        console.log("Cleaning up ride listeners");
        clearInterval(socketRefreshInterval);
      };
    } else {
      // Clear rides when going off duty
      console.log("Rider going off duty - clearing rides");
      setRideOffers([]);
    }

    return () => {
      off("allSearchingRides");
      off("newRideRequest");
      off("rideOffer");
      off("rideAccepted");
      off("rideOfferCanceled");
      off("rideOfferTimeout");
    };
  }, [onDuty, on, off, isFocused]);

  const removeRide = (id: string) => {
    setRideOffers((prevOffers) =>
      prevOffers.filter((offer) => offer._id !== id)
    );
  };

  const renderRides = ({ item }: any) => {
    return (
      <RiderRidesItem removeIt={() => removeRide(item?._id)} item={item} />
    );
  };

  return (
    <View style={homeStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />
      <RiderHeader />

      <FlatList
        data={!onDuty ? [] : rideOffers}
        renderItem={renderRides}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 10, paddingBottom: 120 }}
        keyExtractor={(item: any) => item?._id || Math.random().toString()}
        ListEmptyComponent={
          <View style={riderStyles?.emptyContainer}>
            <Image
              source={require("@/assets/icons/ride.jpg")}
              style={riderStyles?.emptyImage}
            />
            <CustomText fontSize={12} style={{ textAlign: "center" }}>
              {onDuty
                ? "🔍 Searching for rides city-wide...\nStay Active!"
                : "You're currently OFF-DUTY, please go ON-DUTY to start earning"}
            </CustomText>
            {onDuty && (
              <View style={{
                backgroundColor: '#4CAF50',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 15,
                marginTop: 10,
                alignSelf: 'center'
              }}>
                <CustomText fontSize={10} style={{ color: 'white', textAlign: 'center' }}>
                  🌍 Monitoring ALL city rides
                </CustomText>
              </View>
            )}
          </View>
        }
      />

      <OtpDisplayModal
        visible={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setAcceptedRide(null);
        }}
        otp={acceptedRide?.otp || ""}
        rideId={acceptedRide?._id || ""}
      />
    </View>
  );
};

export default RiderHome;

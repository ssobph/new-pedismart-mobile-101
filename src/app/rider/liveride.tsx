import { View, Text, Alert, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useRiderStore } from "@/store/riderStore";
import { useWS } from "@/service/WSProvider";
import { useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { resetAndNavigate } from "@/utils/Helpers";
import { StatusBar } from "expo-status-bar";
import { rideStyles } from "@/styles/rideStyles";
import RiderLiveTracking from "@/components/rider/RiderLiveTracking";
import { updateRideStatus } from "@/service/rideService";
import RiderActionButton from "@/components/rider/RiderActionButton";
import OtpInputModal from "@/components/rider/OtpInputModal";
import CustomText from "@/components/shared/CustomText";

export default function LiveRide() {
  const [isOtpModalVisible, setOtpModalVisible] = useState(false);
  const { setLocation, location, setOnDuty } = useRiderStore();
  const { emit, on, off } = useWS();
  const [rideData, setRideData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const route = useRoute() as any;
  const params = route?.params || {};
  const id = params.id;

  useEffect(() => {
    let locationSubscription: any;

    const startLocationUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 300,
          },
          (location) => {
            const { latitude, longitude, heading } = location.coords;
            setLocation({
              latitude: latitude,
              longitude: longitude,
              address: "Somewhere",
              heading: heading as number,
            });

            setOnDuty(true);

            emit("goOnDuty", {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: heading as number,
            });

            emit("updateLocation", {
              latitude,
              longitude,
              heading,
            });
            console.log(
              `Location updated: Lat ${latitude}, Lon ${longitude}, Heading: ${heading}`
            );
          }
        );
      } else {
        console.log("Location permission denied");
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [id]);

  useEffect(() => {
    if (id) {
      emit("subscribeRide", id);

      on("rideData", (data) => {
        console.log('Received ride data:', data);
        setRideData(data);
        setIsLoading(false);
        setError(null);
      });

      on("rideCanceled", (error) => {
        console.log("Ride canceled:", error);
        setError('Ride was canceled');
        setIsLoading(false);
        resetAndNavigate("/rider/home");
        Alert.alert("Ride Canceled");
      });

      on("rideUpdate", (data) => {
        console.log('Received ride update:', data);
        setRideData(data);
        setError(null);
      });

      on("error", (error) => {
        console.error("Ride error:", error);
        setError('Failed to load ride data');
        setIsLoading(false);
        resetAndNavigate("/rider/home");
        Alert.alert("Oh Dang! There was an error");
      });
    }

    return () => {
      off("rideData");
      off("rideUpdate");
      off("rideCanceled");
      off("error");
    };
  }, [id, emit, on, off]);

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {rideData ? (
        <RiderLiveTracking
          status={rideData?.status || 'UNKNOWN'}
          drop={{
            latitude: rideData?.drop?.latitude ? parseFloat(rideData.drop.latitude) : null,
            longitude: rideData?.drop?.longitude ? parseFloat(rideData.drop.longitude) : null,
          }}
          pickup={{
            latitude: rideData?.pickup?.latitude ? parseFloat(rideData.pickup.latitude) : null,
            longitude: rideData?.pickup?.longitude ? parseFloat(rideData.pickup.longitude) : null,
          }}
          rider={{
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
            heading: location?.heading || 0,
          }}
        />
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <ActivityIndicator size="large" color="orange" />
          <CustomText fontSize={14} style={{ marginTop: 10, color: '#666' }}>Loading ride data...</CustomText>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <CustomText fontSize={14} style={{ color: '#666' }}>No ride data available</CustomText>
          {error && <CustomText fontSize={12} style={{ color: 'red', marginTop: 10 }}>{error}</CustomText>}
        </View>
      )}

      <RiderActionButton
        ride={rideData}
        title={
          rideData?.status === "START"
            ? "ARRIVED"
            : rideData?.status === "ARRIVED"
            ? "COMPLETED"
            : "SUCCESS"
        }
        onPress={async () => {
          if (rideData?.status === "START") {
            setOtpModalVisible(true);
            return;
          }
          const isSuccess = await updateRideStatus(rideData?._id, "COMPLETED");
          if (isSuccess) {
            Alert.alert("Congratulations! Ride is Completed 🎉");
            resetAndNavigate("/rider/home");
          } else {
            Alert.alert("There was an error");
          }
        }}
        color="#228B22"
      />

      {isOtpModalVisible && (
        <OtpInputModal
          visible={isOtpModalVisible}
          onClose={() => setOtpModalVisible(false)}
          title="Enter OTP Below"
          onConfirm={async (otp) => {
            if (otp === rideData?.otp) {
              const isSuccess = await updateRideStatus(
                rideData?._id,
                "ARRIVED"
              );
              if (isSuccess) {
                setOtpModalVisible(false);
              } else {
                Alert.alert("Technical Error");
              }
            } else {
              Alert.alert("Wrong OTP");
            }
          }}
        />
      )}
    </View>
  );
};


import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { useUserStore } from "@/store/userStore";
import { rideStyles } from "@/styles/rideStyles";
import { StatusBar } from "expo-status-bar";
import { calculateFare } from "@/utils/mapUtils";
import RoutesMap from "@/components/customer/RoutesMap";
import CustomText from "@/components/shared/CustomText";
import { router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { commonStyles } from "@/styles/commonStyles";
import CustomButton from "@/components/shared/CustomButton";
import { createRide } from "@/service/rideService";

const RideBooking = () => {
  const route = useRoute() as any;
  const item = route?.params as any;
  const { location } = useUserStore() as any;
  const [selectedOption, setSelectedOption] = useState("Bike");
  const [loading, setLoading] = useState(false);

  const farePrices = useMemo(
    () => calculateFare(parseFloat(item?.distanceInKm)),
    [item?.distanceInKm]
  );

  const rideOptions = useMemo(
    () => [
      {
        type: "Bike",
        seats: 1,
        time: "1 min",
        dropTime: "4:28 pm",
        price: farePrices?.bike,
        isFastest: true,
        icon: require("@/assets/icons/bike.png"),
      },
      {
        type: "Auto",
        seats: 3,
        time: "1 min",
        dropTime: "4:30 pm",
        price: farePrices.auto,
        icon: require("@/assets/icons/auto.png"),
      },
      {
        type: "Cab Economy",
        seats: 4,
        time: "1 min",
        dropTime: "4:28 pm",
        price: farePrices.cabEconomy,
        icon: require("@/assets/icons/cab.png"),
      },
      {
        type: "Cab Premium",
        seats: 4,
        time: "1 min",
        dropTime: "4:30 pm",
        price: farePrices.cabPremium,
        icon: require("@/assets/icons/cab_premium.png"),
      },
    ],
    [farePrices]
  );

  const handleOptionSelect = useCallback((type: string) => {
    setSelectedOption(type);
  }, []);

  const handleRideBooking = async () => {
    setLoading(true);

    await createRide({
      vehicle:
        selectedOption === "Cab Economy"
          ? "cabEconomy"
          : selectedOption === "Cab Premium"
          ? "cabPremium"
          : selectedOption === "Bike"
          ? "bike"
          : "auto",
      drop: {
        latitude: parseFloat(item.drop_latitude),
        longitude: parseFloat(item.drop_longitude),
        address: item?.drop_address,
      },
      pickup: {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        address: location.address,
      },
    });

    setLoading(false);
  };

  return (
    <View style={rideStyles.container}>
      <StatusBar style="light" backgroundColor="orange" translucent={false} />

      {item?.drop_latitude && location?.latitude && (
        <RoutesMap
          drop={{
            latitude: parseFloat(item?.drop_latitude),
            longitude: parseFloat(item?.drop_longitude),
          }}
          pickup={{
            latitude: parseFloat(location?.latitude),
            longitude: parseFloat(location?.longitude),
          }}
        />
      )}

      <View style={rideStyles.rideSelectionContainer}>
        <View style={rideStyles?.offerContainer}>
          <CustomText fontSize={12} style={rideStyles.offerText}>
            You get ₱10 off 5 coins cashback!
          </CustomText>
        </View>

        <ScrollView
          contentContainerStyle={rideStyles?.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {rideOptions?.map((ride, index) => (
            <RideOption
              key={index}
              ride={ride}
              selected={selectedOption}
              onSelect={handleOptionSelect}
            />
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={rideStyles.backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons
          name="arrow-back-ios"
          size={RFValue(14)}
          style={{ left: 4 }}
          color="black"
        />
      </TouchableOpacity>

      <View style={rideStyles.bookingContainer}>
        <View style={commonStyles.flexRowBetween}>
          <View
            style={[
              rideStyles.couponContainer,
              { borderRightWidth: 0, borderRightColor: "#ccc" },
            ]}
          >
            <Image
              source={require("@/assets/icons/rupee.png")}
              style={rideStyles?.icon}
            />
            <View>
              <CustomText fontFamily="Medium" fontSize={12}>
                Cash
              </CustomText>
              <CustomText
                fontFamily="Medium"
                fontSize={10}
                style={{ opacity: 0.7 }}
              >
                Far: {item?.distanceInKm} KM
              </CustomText>
            </View>
            {/*<Ionicons name="chevron-forward" size={RFValue(14)} color="#777" />*/}
          </View>
            {/*
          <View style={rideStyles.couponContainer}>
            <Image
              source={require("@/assets/icons/coupon.png")}
              style={rideStyles.icon}
            />
            <View>
              <CustomText fontFamily="Medium" fontSize={12}>
                DHANOO
              </CustomText>
              <CustomText
                style={{ opacity: 0.7 }}
                fontFamily="Medium"
                fontSize={10}
              >
                Coupon Applied
              </CustomText>
            </View>
            <Ionicons name="chevron-forward" size={RFValue(14)} color="#777" />
          </View> */}
        </View>

        <CustomButton
          title="Book Ride"
          disabled={loading}
          loading={loading}
          onPress={handleRideBooking}
        />
      </View>
    </View>
  );
};

const RideOption = memo(({ ride, selected, onSelect }: any) => (
  <TouchableOpacity
    onPress={() => onSelect(ride?.type)}
    style={[
      rideStyles.rideOption,
      { borderColor: selected === ride.type ? "#222" : "#ddd" },
    ]}
  >
    <View style={commonStyles.flexRowBetween}>
      <Image source={ride?.icon} style={rideStyles?.rideIcon} />

      <View style={rideStyles?.rideDetails}>
        <CustomText fontFamily="Medium" fontSize={12}>
          {ride?.type}{" "}
          {ride?.isFastest && (
            <Text style={rideStyles.fastestLabel}>FASTEST</Text>
          )}
        </CustomText>
        <CustomText fontSize={10}>
          {ride?.seats} seats • {ride?.time} away • Drop {ride?.dropTime}
        </CustomText>
      </View>

      <View style={rideStyles?.priceContainer}>
        <CustomText fontFamily="Medium" fontSize={14}>
          ₱{ride?.price?.toFixed(2)}
        </CustomText>
        {selected === ride.type && (
          <Text style={rideStyles?.discountedPrice}>
            ₱{Number(ride?.price + 10).toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
));

export default memo(RideBooking);

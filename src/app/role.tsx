import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";
import { roleStyles } from "@/styles/roleStyles";
import CustomText from "@/components/shared/CustomText";

const Role = () => {
  const handleCustomerPress = () => {
    router.navigate("/customer/auth");
  };

  const handleRiderPress = () => {
    router.navigate("/rider/auth");
  };

  return (
    <View style={roleStyles.container}>
      <Image
        source={require("@/assets/images/pedismart_logo.png")}
        style={roleStyles.logo}
      />
      <CustomText fontFamily="Medium" variant="h6">
        Choose your User Type
      </CustomText>

      <TouchableOpacity style={roleStyles.card} onPress={handleCustomerPress}>
        <Image
          source={require("@/assets/images/customer_banner4.png")}
          style={roleStyles.image}
        />
        <View style={roleStyles.cardContent}>
          <CustomText style={roleStyles.title}>Passenger</CustomText>
          <CustomText style={roleStyles.description}>
            Are you a passenger? Order rides easily.
          </CustomText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={roleStyles.card} onPress={handleRiderPress}>
        <Image
          source={require("@/assets/images/rider_banner1.png")}
          style={roleStyles.image}
        />
        <View style={roleStyles.cardContent}>
          <CustomText style={roleStyles.title}>Rider</CustomText>
          <CustomText style={roleStyles.description}>
            Are you a Rider? Join us to drive and earn.
          </CustomText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Role;

import { View, Image, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { commonStyles } from "@/styles/commonStyles";
import { splashStyles } from "@/styles/splashStyles";
import CustomText from "@/components/shared/CustomText";
import { useUserStore } from "@/store/userStore";
import { tokenStorage } from "@/store/storage";
import { jwtDecode } from "jwt-decode";
import { resetAndNavigate } from "@/utils/Helpers";
import { refresh_tokens } from "@/service/apiInterceptors";
import { logout } from "@/service/authService";

interface DecodedToken {
  exp: number;
}

export default function Main() {
  const [loaded] = useFonts({
    Bold: require("../assets/fonts/NotoSans-Bold.ttf"),
    Regular: require("../assets/fonts/NotoSans-Regular.ttf"),
    Medium: require("../assets/fonts/NotoSans-Medium.ttf"),
    Light: require("../assets/fonts/NotoSans-Light.ttf"),
    SemiBold: require("../assets/fonts/NotoSans-SemiBold.ttf"),
  });

  const { user } = useUserStore();

  const [hasNavigated, setHasNavigated] = useState(false);

  const tokenCheck = async () => {
    try {
      const access_token = await tokenStorage.getString("access_token");
      const refresh_token = await tokenStorage.getString("refresh_token");

      if (access_token) {
        const decodedAccessToken = jwtDecode<DecodedToken>(access_token);
        const decodedRefreshToken = refresh_token ? jwtDecode<DecodedToken>(refresh_token) : null;

        const currentTime = Date.now() / 1000;

        if (decodedRefreshToken && decodedRefreshToken.exp && decodedRefreshToken.exp < currentTime) {
          logout();
          Alert.alert("Session Expired, please login again");
        }

        if (decodedAccessToken?.exp < currentTime) {
          try {
            await refresh_tokens();
          } catch (err) {
            console.log(err);
            Alert.alert("Refresh Token Error");
          }
        }

        if (user) {
          resetAndNavigate("/customer/home");
        } else {
          resetAndNavigate("/rider/home");
        }

        return;
      }

      resetAndNavigate("/role");
    } catch (error) {
      console.error("Token check error:", error);
      resetAndNavigate("/role");
    }
  };

  useEffect(() => {
    if (loaded && !hasNavigated) {
      const timeoutId = setTimeout(() => {
        tokenCheck();
        setHasNavigated(true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [loaded, hasNavigated]);

  return (
    <View style={commonStyles.container}>
      <Image
        source={require("@/assets/images/pedismart_logo.png")}
        style={splashStyles.img}
      />
      <CustomText variant="h5" fontFamily="Medium" style={splashStyles.text}>
        PediSmart - All rights reserved. 2025
      </CustomText>
    </View>
  );
}

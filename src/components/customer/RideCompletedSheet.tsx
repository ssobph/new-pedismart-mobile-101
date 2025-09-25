import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { FC } from "react";
import { rideStyles } from "@/styles/rideStyles";
import { commonStyles } from "@/styles/commonStyles";
import CustomText from "../shared/CustomText";
import { vehicleIcons } from "@/utils/mapUtils";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { resetAndNavigate } from "@/utils/Helpers";

type VehicleType = "Single Motorcycle" | "Tricycle" | "Cab";

interface RideItem {
  _id: string;
  vehicle?: VehicleType;
  pickup?: { address: string };
  drop?: { address: string };
  fare?: number;
  otp?: string;
  rider: any;
  status: string;
}

const RideCompletedSheet: FC<{ item: RideItem }> = ({ item }) => {
  return (
    <View>
      {/* Success Header */}
      <View style={[rideStyles?.headerContainer, { backgroundColor: '#4CAF50', borderRadius: 10, margin: 10 }]}>
        <View style={commonStyles.flexRowGap}>
          <Ionicons name="checkmark-circle" size={40} color="white" />
          <View>
            <CustomText fontSize={16} fontFamily="Bold" style={{ color: 'white' }}>
              Ride Completed! 🎉
            </CustomText>
            <CustomText fontSize={12} style={{ color: 'white', opacity: 0.9 }}>
              Thank you for using our service
            </CustomText>
          </View>
        </View>
      </View>

      {/* Ride Summary */}
      <View style={{ padding: 10 }}>
        <CustomText fontFamily="SemiBold" fontSize={14} style={{ marginBottom: 10 }}>
          Ride Summary
        </CustomText>

        {/* Vehicle Info */}
        <View style={[commonStyles.flexRowGap, { marginBottom: 15 }]}>
          {item.vehicle && (
            <Image
              source={vehicleIcons[item.vehicle]?.icon}
              style={rideStyles.rideIcon}
            />
          )}
          <View>
            <CustomText fontSize={12} fontFamily="Medium">
              {item?.vehicle} ride
            </CustomText>
            <CustomText fontSize={10} style={{ color: '#666' }}>
              Rider: {item?.rider?.name || 'N/A'}
            </CustomText>
          </View>
        </View>

        {/* Location Details */}
        <View
          style={[
            commonStyles.flexRowGap,
            { marginVertical: 10, width: "90%" },
          ]}
        >
          <Image
            source={require("@/assets/icons/marker.png")}
            style={rideStyles.pinIcon}
          />
          <View style={{ flex: 1 }}>
            <CustomText fontSize={10} style={{ color: '#666' }}>From</CustomText>
            <CustomText fontSize={11} numberOfLines={2}>
              {item?.pickup?.address}
            </CustomText>
          </View>
        </View>

        <View style={[commonStyles.flexRowGap, { width: "90%", marginBottom: 15 }]}>
          <Image
            source={require("@/assets/icons/drop_marker.png")}
            style={rideStyles.pinIcon}
          />
          <View style={{ flex: 1 }}>
            <CustomText fontSize={10} style={{ color: '#666' }}>To</CustomText>
            <CustomText fontSize={11} numberOfLines={2}>
              {item?.drop?.address}
            </CustomText>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 15, 
          borderRadius: 10, 
          marginVertical: 10 
        }}>
          <View style={[commonStyles.flexRowBetween, { marginBottom: 10 }]}>
            <View style={commonStyles.flexRow}>
              <MaterialCommunityIcons
                name="credit-card"
                size={24}
                color="#4CAF50"
              />
              <CustomText
                style={{ marginLeft: 10 }}
                fontFamily="SemiBold"
                fontSize={14}
              >
                Total Payment
              </CustomText>
            </View>

            <CustomText fontFamily="Bold" fontSize={18} style={{ color: '#4CAF50' }}>
              ₱ {item.fare?.toFixed(2)}
            </CustomText>
          </View>

          <CustomText fontSize={11} style={{ color: '#666' }}>
            Payment via cash - Paid to rider
          </CustomText>
        </View>

        {/* Rating Section */}
        <View style={{ 
          backgroundColor: '#fff3cd', 
          padding: 15, 
          borderRadius: 10, 
          marginVertical: 10,
          borderLeftWidth: 4,
          borderLeftColor: '#ffc107'
        }}>
          <CustomText fontFamily="SemiBold" fontSize={12} style={{ marginBottom: 5 }}>
            Rate Your Experience
          </CustomText>
          <CustomText fontSize={10} style={{ color: '#666' }}>
            Help us improve by rating your ride experience
          </CustomText>
          
          <View style={[commonStyles.flexRow, { marginTop: 10 }]}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} style={{ marginRight: 5 }}>
                <Ionicons name="star-outline" size={24} color="#ffc107" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={rideStyles.bottomButtonContainer}>
        <TouchableOpacity
          style={[rideStyles.backButton2, { backgroundColor: '#4CAF50', flex: 1 }]}
          onPress={() => {
            resetAndNavigate("/customer/home");
          }}
        >
          <CustomText style={[rideStyles.backButtonText, { color: 'white' }]}>
            Book Another Ride
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RideCompletedSheet;

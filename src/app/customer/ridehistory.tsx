import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import RideHistory from "@/components/customer/RideHistory";

const CustomerRideHistory = () => {
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={RFValue(24)} color="black" />
        </TouchableOpacity>
        <CustomText fontFamily="Bold" fontSize={18} style={styles.headerTitle}>
          Ride History
        </CustomText>
      </View>

      <View style={styles.historyContainer}>
        <View style={styles.historyFilterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "all" && styles.activeFilterButton,
            ]}
            onPress={() => setHistoryFilter("all")}
          >
            <CustomText
              fontFamily="Medium"
              fontSize={12}
              style={[
                styles.filterButtonText,
                historyFilter === "all" && styles.activeFilterButtonText,
              ]}
            >
              All
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "COMPLETED" && styles.activeFilterButton,
            ]}
            onPress={() => setHistoryFilter("COMPLETED")}
          >
            <CustomText
              fontFamily="Medium"
              fontSize={12}
              style={[
                styles.filterButtonText,
                historyFilter === "COMPLETED" && styles.activeFilterButtonText,
              ]}
            >
              Completed
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "SEARCHING_FOR_RIDER" && styles.activeFilterButton,
            ]}
            onPress={() => setHistoryFilter("SEARCHING_FOR_RIDER")}
          >
            <CustomText
              fontFamily="Medium"
              fontSize={12}
              style={[
                styles.filterButtonText,
                historyFilter === "SEARCHING_FOR_RIDER" && styles.activeFilterButtonText,
              ]}
            >
              Searching
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              (historyFilter === "START" || historyFilter === "ARRIVED") && styles.activeFilterButton,
            ]}
            onPress={() => setHistoryFilter("START")}
          >
            <CustomText
              fontFamily="Medium"
              fontSize={12}
              style={[
                styles.filterButtonText,
                (historyFilter === "START" || historyFilter === "ARRIVED") && styles.activeFilterButtonText,
              ]}
            >
              Active
            </CustomText>
          </TouchableOpacity>
        </View>
        <RideHistory activeTab={historyFilter} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  historyContainer: {
    flex: 1,
  },
  historyFilterContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#F5F5F5",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    color: "#757575",
  },
  activeFilterButtonText: {
    color: "#000000",
  },
});

export default CustomerRideHistory;

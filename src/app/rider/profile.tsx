import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { Colors } from "@/utils/Constants";
import CustomText from "@/components/shared/CustomText";
import CustomInput from "@/components/shared/CustomInput";
import { getUserProfile, updateUserProfile } from "@/service/authService";
import { useRiderStore } from "@/store/riderStore";
import RideHistory from "@/components/rider/RideHistory";

interface ProfileData {
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  licenseId: string;
  sex: string;
}

const RiderProfile = () => {
  const { user } = useRiderStore();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "history">(
    params.tab === "history" ? "history" : "profile"
  );
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    licenseId: "",
    sex: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      console.log("Fetched user profile data:", userData); // Debug log
      setProfileData({
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        lastName: userData.lastName || "",
        phone: userData.phone || "",
        email: userData.email || "",
        licenseId: userData.licenseId || "",
        sex: userData.sex || "",
      });
      
      // Update the rider store with the latest user data
      useRiderStore.getState().setUser({
        ...useRiderStore.getState().user,
        licenseId: userData.licenseId || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderTabContent = () => {
    if (activeTab === "profile") {
      return (
        <ScrollView style={styles.content}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Ionicons name="person" size={RFValue(50)} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.formContainer}>
            <CustomInput
              label="First Name"
              value={profileData.firstName}
              onChangeText={(text: string) => handleInputChange("firstName", text)}
              editable={isEditing}
              style={isEditing ? styles.inputEditable : styles.inputDisabled}
            />

            <CustomInput
              label="Middle Name"
              value={profileData.middleName}
              onChangeText={(text: string) => handleInputChange("middleName", text)}
              editable={isEditing}
              style={isEditing ? styles.inputEditable : styles.inputDisabled}
            />

            <CustomInput
              label="Last Name"
              value={profileData.lastName}
              onChangeText={(text: string) => handleInputChange("lastName", text)}
              editable={isEditing}
              style={isEditing ? styles.inputEditable : styles.inputDisabled}
            />

            <CustomInput
              label="Contact Number"
              value={profileData.phone}
              onChangeText={(text: string) => handleInputChange("phone", text)}
              editable={isEditing}
              keyboardType="phone-pad"
              style={isEditing ? styles.inputEditable : styles.inputDisabled}
            />

            <CustomInput
              label="License ID #"
              value={profileData.licenseId}
              onChangeText={(text: string) => handleInputChange("licenseId", text)}
              editable={false}
              style={styles.inputDisabled}
            />

            <CustomInput
              label="Email"
              value={profileData.email}
              onChangeText={(text: string) => handleInputChange("email", text)}
              editable={isEditing}
              keyboardType="email-address"
              style={isEditing ? styles.inputEditable : styles.inputDisabled}
            />

            <View style={styles.inputContainer}>
              <CustomText fontFamily="Medium">Sex</CustomText>
              {isEditing ? (
                <View style={styles.radioContainer}>
                  <TouchableOpacity 
                    style={[styles.radioButton, profileData.sex === "male" && styles.radioButtonSelected]} 
                    onPress={() => handleInputChange("sex", "male")}
                  >
                    <View style={[styles.radioCircle, profileData.sex === "male" && styles.radioCircleSelected]} />
                    <CustomText fontFamily="Regular">Male</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.radioButton, profileData.sex === "female" && styles.radioButtonSelected]} 
                    onPress={() => handleInputChange("sex", "female")}
                  >
                    <View style={[styles.radioCircle, profileData.sex === "female" && styles.radioCircleSelected]} />
                    <CustomText fontFamily="Regular">Female</CustomText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.input, styles.inputDisabled, { justifyContent: 'center' }]}>
                  <CustomText fontFamily="Regular">{profileData.sex || 'Not specified'}</CustomText>
                </View>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateProfile}
                >
                  <CustomText fontFamily="Medium" fontSize={14} style={styles.buttonText}>
                    Save
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsEditing(false)}
                >
                  <CustomText fontFamily="Medium" fontSize={14} style={styles.buttonText}>
                    Cancel
                  </CustomText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <CustomText fontFamily="Medium" fontSize={14} style={styles.buttonText}>
                  Edit Profile
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      );
    } else {
      return (
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
      );
    }
  };

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
          My Profile
        </CustomText>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <CustomText
            fontFamily="Medium"
            fontSize={14}
            style={[
              styles.tabText,
              activeTab === "profile" && styles.activeTabText,
            ]}
          >
            Profile
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
          testID="history-tab"
        >
          <CustomText
            fontFamily="Medium"
            fontSize={14}
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            Ride History
          </CustomText>
        </TouchableOpacity>
      </View>

      {isLoading && activeTab === "profile" ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        renderTabContent()
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: RFValue(100),
    height: RFValue(100),
    borderRadius: RFValue(50),
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  inputEditable: {
    backgroundColor: "#FFFFFF",
    borderColor: Colors.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  buttonText: {
    color: "#000000",
  },
  radioContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioButtonSelected: {
    opacity: 1,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
    borderWidth: 6,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: "#757575",
  },
  activeTabText: {
    color: Colors.primary,
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

export default RiderProfile;

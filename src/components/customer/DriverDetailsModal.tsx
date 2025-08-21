import React, { FC, useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '../shared/CustomText';
import { Colors } from '@/utils/Constants';
import RiderRatingCard from './RiderRatingCard';

interface DriverDetailsModalProps {
  visible: boolean;
  driverDetails: any;
  onClose: () => void;
}

const DriverDetailsModal: FC<DriverDetailsModalProps> = ({
  visible,
  driverDetails,
  onClose,
}) => {
  const [showRatings, setShowRatings] = useState(false);

  if (!driverDetails) return null;

  const getVehicleTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bike':
        return 'Motorcycle';
      case 'auto':
        return 'Tuk-Tuk';
      case 'cab':
        return 'Taxi';
      default:
        return 'Vehicle';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'bike':
        return require('@/assets/icons/bike_marker.png');
      case 'auto':
        return require('@/assets/icons/auto_marker.png');
      case 'cab':
      default:
        return require('@/assets/icons/cab_marker.png');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={RFValue(24)} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Image
              source={getVehicleIcon(driverDetails.vehicleType)}
              style={styles.vehicleIcon}
            />
            <CustomText fontFamily="SemiBold" fontSize={18} style={styles.title}>
              {getVehicleTypeLabel(driverDetails.vehicleType)} Driver
            </CustomText>
          </View>

          <View style={styles.driverInfoSection}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="user" size={RFValue(16)} color={Colors.primary} style={styles.icon} />
              <View>
                <CustomText fontFamily="Medium" fontSize={16} style={styles.label}>
                  Driver Name
                </CustomText>
                <CustomText fontSize={14} style={styles.value}>
                  {driverDetails.firstName} {driverDetails.lastName}
                </CustomText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome5 name="phone-alt" size={RFValue(16)} color={Colors.primary} style={styles.icon} />
              <View>
                <CustomText fontFamily="Medium" fontSize={16} style={styles.label}>
                  Contact Number
                </CustomText>
                <CustomText fontSize={14} style={styles.value}>
                  {driverDetails.phone}
                </CustomText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome5 name="id-card" size={RFValue(16)} color={Colors.primary} style={styles.icon} />
              <View>
                <CustomText fontFamily="Medium" fontSize={16} style={styles.label}>
                  License ID #
                </CustomText>
                <CustomText fontSize={14} style={styles.value}>
                  {driverDetails.licenseId || 'Not available'}
                </CustomText>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.ratingsButton}
              onPress={() => setShowRatings(!showRatings)}
            >
              <View style={styles.ratingsButtonContent}>
                <MaterialIcons name="star-rate" size={RFValue(18)} color={Colors.primary} />
                <CustomText fontFamily="Medium" fontSize={16} style={styles.ratingsButtonText}>
                  View Driver Ratings
                </CustomText>
              </View>
              <Ionicons 
                name={showRatings ? "chevron-up" : "chevron-down"} 
                size={RFValue(16)} 
                color={Colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {showRatings && driverDetails._id && (
            <View style={styles.ratingsContainer}>
              <RiderRatingCard 
                riderId={driverDetails._id} 
                riderName={`${driverDetails.firstName} ${driverDetails.lastName}`}
              />
            </View>
          )}

          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={RFValue(18)} color="#fff" />
            <CustomText fontFamily="SemiBold" fontSize={16} style={styles.callButtonText}>
              Call Driver
            </CustomText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    color: Colors.text,
  },
  driverInfoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  icon: {
    marginRight: 15,
    marginTop: 3,
    width: 20,
    textAlign: 'center',
  },
  label: {
    color: Colors.text,
    marginBottom: 2,
  },
  value: {
    color: '#666',
  },
  ratingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  ratingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingsButtonText: {
    color: Colors.primary,
    marginLeft: 10,
  },
  ratingsContainer: {
    marginBottom: 20,
  },
  callButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  callButtonText: {
    color: '#fff',
    marginLeft: 10,
  },
});

export default DriverDetailsModal;

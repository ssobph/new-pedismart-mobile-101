import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors } from '@/utils/Constants';
import CustomText from './CustomText';
import { formatDate } from '@/utils/Helpers';
import RatingModal from '@/components/customer/RatingModal';
import { checkRideRating } from '@/service/rideService';

interface RideHistoryItemProps {
  ride: {
    _id: string;
    vehicle: string;
    distance: number;
    fare: number;
    pickup: {
      address: string;
    };
    drop: {
      address: string;
    };
    status: string;
    customer: {
      name: string;
      phone: string;
    };
    rider: {
      name: string;
      phone: string;
      _id?: string;
    } | null;
    createdAt: string;
  };
  onPress?: () => void;
  isRider?: boolean;
}

const getVehicleIcon = (vehicle: string) => {
  switch (vehicle) {
    case 'bike':
      return 'bicycle';
    case 'auto':
      return 'car-sport';
    case 'cabEconomy':
    case 'cabPremium':
      return 'car';
    default:
      return 'car';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#4CAF50'; // Green color for success
    case 'SEARCHING_FOR_RIDER':
      return '#FFC107'; // Amber color for warning
    case 'START':
    case 'ARRIVED':
      return Colors.primary;
    default:
      return Colors.text;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'SEARCHING_FOR_RIDER':
      return 'Searching';
    case 'START':
      return 'Started';
    case 'ARRIVED':
      return 'Arrived';
    default:
      return status;
  }
};

const RideHistoryItem: React.FC<RideHistoryItemProps> = ({ ride, onPress, isRider = false }) => {
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const formattedDate = formatDate(new Date(ride.createdAt));
  const vehicleIcon = getVehicleIcon(ride.vehicle);
  const statusColor = getStatusColor(ride.status);
  const statusText = getStatusText(ride.status);
  
  // Check if the ride has already been rated
  useEffect(() => {
    if (!isRider && ride.status === 'COMPLETED' && ride._id) {
      checkIfRideRated();
    }
  }, [ride._id, isRider, ride.status]);

  const checkIfRideRated = async () => {
    try {
      setLoading(true);
      const result = await checkRideRating(ride._id);
      setHasRated(result.rated);
    } catch (error) {
      console.error('Error checking if ride is rated:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format vehicle name for display
  const getVehicleName = (vehicle: string) => {
    switch (vehicle) {
      case 'bike':
        return 'Bike';
      case 'auto':
        return 'Auto';
      case 'cabEconomy':
        return 'Cab Economy';
      case 'cabPremium':
        return 'Cab Premium';
      default:
        return vehicle;
    }
  };

  const handleRateRide = (e: any) => {
    e.stopPropagation();
    setRatingModalVisible(true);
  };

  // Determine if we should show the rate button
  const shouldShowRateButton = !isRider && ride.status === 'COMPLETED' && ride.rider && !hasRated;

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.iconContainer}>
          <Ionicons name={vehicleIcon} size={RFValue(24)} color={Colors.primary} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <CustomText fontFamily="Medium" fontSize={16}>
              {getVehicleName(ride.vehicle)}
            </CustomText>
            <CustomText fontFamily="Medium" fontSize={14} style={{ color: statusColor }}>
              {statusText}
            </CustomText>
          </View>
          
          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dotStart} />
              <CustomText fontFamily="Regular" fontSize={12} numberOfLines={1} style={styles.locationText}>
                {ride.pickup.address}
              </CustomText>
            </View>
            
            <View style={styles.locationDivider} />
            
            <View style={styles.locationRow}>
              <View style={styles.dotEnd} />
              <CustomText fontFamily="Regular" fontSize={12} numberOfLines={1} style={styles.locationText}>
                {ride.drop.address}
              </CustomText>
            </View>
          </View>
          
          <View style={styles.footerRow}>
            <CustomText fontFamily="Regular" fontSize={12} style={styles.dateText}>
              {formattedDate}
            </CustomText>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <CustomText fontFamily="Regular" fontSize={12}>
                  {ride.distance.toFixed(1)} km
                </CustomText>
              </View>
              
              <View style={styles.detailItem}>
                <CustomText fontFamily="Medium" fontSize={12}>
                  ₱{ride.fare.toFixed(2)}
                </CustomText>
              </View>
            </View>
          </View>
          
          {isRider ? (
            <CustomText fontFamily="Regular" fontSize={12} style={styles.personInfo}>
              Passenger: {ride.customer.name}
            </CustomText>
          ) : ride.rider ? (
            <View style={styles.riderInfoContainer}>
              <CustomText fontFamily="Regular" fontSize={12} style={styles.personInfo}>
                Driver: {ride.rider.name}
              </CustomText>
              
              {/* Show Rate button only if the ride is completed, has a rider, and hasn't been rated yet */}
              {shouldShowRateButton && (
                <TouchableOpacity 
                  style={styles.rateButton}
                  onPress={handleRateRide}
                >
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.rateButtonText}>
                    Rate
                  </CustomText>
                  <Ionicons name="star" size={RFValue(12)} color="#FFFFFF" style={styles.rateButtonIcon} />
                </TouchableOpacity>
              )}
              
              {/* Show "Rated" badge if the ride has already been rated */}
              {!isRider && ride.status === 'COMPLETED' && hasRated && (
                <View style={styles.ratedBadge}>
                  <Ionicons name="checkmark-circle" size={RFValue(12)} color="#FFFFFF" style={styles.ratedIcon} />
                  <CustomText fontFamily="Medium" fontSize={12} style={styles.ratedText}>
                    Rated
                  </CustomText>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      
      {/* Only show rating modal for customers (not riders) and only if the ride hasn't been rated yet */}
      {!isRider && ride.rider && !hasRated && (
        <RatingModal 
          visible={ratingModalVisible} 
          onClose={() => {
            setRatingModalVisible(false);
            // Check if the ride has been rated after closing the modal
            checkIfRideRated();
          }} 
          rideId={ride._id}
          riderName={ride.rider.name}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: RFValue(40),
    height: RFValue(40),
    borderRadius: RFValue(20),
    backgroundColor: Colors.secondary_light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  dotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50', // Green color for destination
    marginRight: 8,
  },
  locationDivider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.secondary_light,
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    flex: 1,
    color: Colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#757575', // Gray color for date text
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  detailItem: {
    marginLeft: 10,
  },
  personInfo: {
    marginTop: 4,
    color: '#757575', // Gray color for person info
  },
  riderInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateButtonText: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  rateButtonIcon: {
    marginLeft: 2,
  },
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50', // Green color for success
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratedText: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  ratedIcon: {
    marginRight: 4,
  },
});

export default RideHistoryItem;

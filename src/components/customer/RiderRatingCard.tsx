import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '@/utils/Constants';
import CustomText from '@/components/shared/CustomText';
import { getRiderRatings } from '@/service/rideService';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';

interface RiderRatingCardProps {
  riderId: string;
  riderName: string;
  onClose?: () => void;
}

const RiderRatingCard: React.FC<RiderRatingCardProps> = ({ 
  riderId, 
  riderName,
  onClose 
}) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<string>('0.0');
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    fetchRiderRatings();
  }, [riderId]);

  const fetchRiderRatings = async () => {
    try {
      setLoading(true);
      const data = await getRiderRatings(riderId);
      setRatings(data.ratings || []);
      setAverageRating(data.averageRating || '0.0');
      setTotalRatings(data.count || 0);
    } catch (error) {
      console.error('Error fetching rider ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= rating ? 'star' : 'star-outline'} 
          size={RFValue(14)} 
          color={i <= rating ? Colors.primary : '#CCCCCC'} 
          style={styles.star}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomText fontFamily="Bold" fontSize={16}>
            Driver Ratings
          </CustomText>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={RFValue(20)} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText fontFamily="Bold" fontSize={16}>
          Driver Ratings
        </CustomText>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={RFValue(20)} color="#000000" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.ratingOverview}>
        <View style={styles.ratingNumberContainer}>
          <CustomText fontFamily="Bold" fontSize={24} style={styles.ratingNumber}>
            {averageRating}
          </CustomText>
          <View style={styles.starsRow}>
            {renderStars(parseFloat(averageRating))}
          </View>
          <CustomText fontFamily="Regular" fontSize={12} style={styles.totalRatings}>
            {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </CustomText>
        </View>
        
        <View style={styles.driverInfo}>
          <CustomText fontFamily="Medium" fontSize={14}>
            {riderName}
          </CustomText>
        </View>
      </View>

      {totalRatings > 0 && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <CustomText fontFamily="Medium" fontSize={14} style={styles.expandButtonText}>
            {expanded ? 'Hide Reviews' : 'Show Reviews'}
          </CustomText>
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={RFValue(16)} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
      )}

      {expanded && totalRatings > 0 && (
        <View style={styles.reviewsContainer}>
          {ratings.slice(0, 3).map((rating, index) => (
            <View key={rating._id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <CustomText fontFamily="Medium" fontSize={12}>
                  {rating.customer?.firstName || ''} {rating.customer?.lastName || ''}
                </CustomText>
                <View style={styles.reviewStars}>
                  {renderStars(rating.rating)}
                </View>
              </View>
              
              {rating.comment && (
                <CustomText fontFamily="Regular" fontSize={12} style={styles.reviewComment}>
                  "{rating.comment}"
                </CustomText>
              )}
              
              {index < ratings.slice(0, 3).length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
          
          {totalRatings > 3 && (
            <CustomText fontFamily="Regular" fontSize={12} style={styles.moreReviews}>
              +{totalRatings - 3} more reviews
            </CustomText>
          )}
        </View>
      )}

      {totalRatings === 0 && (
        <View style={styles.noReviewsContainer}>
          <CustomText fontFamily="Regular" fontSize={14} style={styles.noReviewsText}>
            No reviews yet
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingNumberContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  ratingNumber: {
    color: Colors.primary,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  star: {
    marginHorizontal: 1,
  },
  totalRatings: {
    color: '#757575',
  },
  driverInfo: {
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  expandButtonText: {
    color: Colors.primary,
    marginRight: 5,
  },
  reviewsContainer: {
    marginTop: 8,
  },
  reviewItem: {
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontStyle: 'italic',
    color: '#555555',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
  moreReviews: {
    textAlign: 'center',
    color: '#757575',
    marginTop: 8,
  },
  noReviewsContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noReviewsText: {
    color: '#757575',
  },
});

export default RiderRatingCard;

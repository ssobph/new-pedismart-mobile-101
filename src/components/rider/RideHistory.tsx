import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/utils/Constants';
import CustomText from '@/components/shared/CustomText';
import RideHistoryItem from '@/components/shared/RideHistoryItem';
import { getRideHistory } from '@/service/rideService';
import { router } from 'expo-router';

interface RideHistoryProps {
  activeTab?: string;
}

const RideHistory: React.FC<RideHistoryProps> = ({ activeTab = 'all' }) => {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRideHistory = async (status?: string) => {
    try {
      setLoading(true);
      const rideData = await getRideHistory(status === 'all' ? undefined : status);
      setRides(rideData);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRideHistory(activeTab);
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideHistory(activeTab);
  };

  const handleRidePress = (rideId: string) => {
    // Navigate to ride details or live tracking if ride is active
    const ride = rides.find(r => r._id === rideId);
    if (ride && ride.status !== 'COMPLETED') {
      router.navigate({
        pathname: '/rider/liveride',
        params: { id: rideId }
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText fontFamily="Medium" fontSize={16} style={styles.emptyText}>
            No ride history found
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <RideHistoryItem 
              ride={item} 
              onPress={() => handleRidePress(item._id)}
              isRider={true}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#757575',
    textAlign: 'center',
  },
});

export default RideHistory;

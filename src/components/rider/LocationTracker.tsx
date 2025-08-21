import React, { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useRiderStore } from '@/store/riderStore';
import { useWS } from '@/service/WSProvider';
import { AppState, AppStateStatus } from 'react-native';

const LocationTracker: React.FC = () => {
  const { onDuty, setLocation } = useRiderStore();
  const { emit } = useWS();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  // Handle location tracking
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      
      const { latitude, longitude, heading } = initialLocation.coords;
      
      // Update local store
      setLocation({
        latitude,
        longitude,
        address: 'Current Location',
        heading: heading || 0,
      });
      
      // Send initial location to server
      emit('updateLocation', {
        latitude,
        longitude,
        heading: heading || 0,
      });

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Or at least every 5 seconds
        },
        (location) => {
          const { latitude, longitude, heading } = location.coords;
          
          // Update local store
          setLocation({
            latitude,
            longitude,
            address: 'Current Location',
            heading: heading || 0,
          });
          
          // Send location update to server
          emit('updateLocation', {
            latitude,
            longitude,
            heading: heading || 0,
          });
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (onDuty) {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        startLocationTracking();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        stopLocationTracking();
      }
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    // Start or stop location tracking based on duty status
    if (onDuty) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    // Set up app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopLocationTracking();
      subscription.remove();
    };
  }, [onDuty]);

  // This component doesn't render anything
  return null;
};

export default LocationTracker;

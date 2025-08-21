// Location Configuration for EcoRide App
// This file contains default location settings that can be easily modified

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

// Default current location - Malita, Davao Occidental, Philippines
export const DEFAULT_CURRENT_LOCATION: LocationData = {
  latitude: 6.413183084408014,
  longitude: 125.61373808311114,
  address: "Malita, Davao Occidental, Philippines"
};

// Map region configuration
export const DEFAULT_MAP_REGION = {
  latitude: DEFAULT_CURRENT_LOCATION.latitude,
  longitude: DEFAULT_CURRENT_LOCATION.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Location service configuration
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
  distanceFilter: 10, // meters
};

// Function to get current default location
export const getCurrentDefaultLocation = (): LocationData => {
  return DEFAULT_CURRENT_LOCATION;
};

// Function to create a new location object
export const createLocation = (
  latitude: number, 
  longitude: number, 
  address: string = ""
): LocationData => {
  return {
    latitude,
    longitude,
    address
  };
};

// Function to calculate distance between two locations (in km)
export const calculateDistance = (
  location1: { latitude: number; longitude: number },
  location2: { latitude: number; longitude: number }
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
  const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Function to check if location is within Davao Occidental bounds
export const isWithinDavaoOccidental = (location: { latitude: number; longitude: number }): boolean => {
  // Approximate bounds for Davao Occidental
  const bounds = {
    north: 6.8,
    south: 5.8,
    east: 126.2,
    west: 125.0
  };
  
  return (
    location.latitude >= bounds.south &&
    location.latitude <= bounds.north &&
    location.longitude >= bounds.west &&
    location.longitude <= bounds.east
  );
};

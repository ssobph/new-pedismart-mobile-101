// Location Configuration for PediSmart App
// This file contains default location settings that can be easily modified

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

// Default current location - Bulacan Agricultural State College - Main Campus
export const DEFAULT_CURRENT_LOCATION: LocationData = {
  latitude: 15.073340554475491,
  longitude: 120.95695658465743,
  address: "Bulacan Agricultural State College - Main Campus, San Ildefonso, Bulacan, Philippines"
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

// Predefined pin locations for easy destination selection
export interface PinLocation extends LocationData {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export const PIN_LOCATIONS: PinLocation[] = [
  {
    id: 'san-miguel-donnas',
    name: "Donna's Restaurant & Special Pasalubong",
    category: 'San Miguel',
    latitude: 15.131632897010784,
    longitude: 120.96200900157332,
    address: "Donna's Restaurant & Special Pasalubong, San Miguel, Bulacan",
    description: "Popular restaurant and pasalubong shop in San Miguel"
  },
  {
    id: 'san-miguel-redhorse',
    name: "Red Horse Monument San Miguel Bulacan",
    category: 'San Miguel',
    latitude: 15.162589779129164,
    longitude: 120.97136973659035,
    address: "Red Horse Monument, San Miguel, Bulacan",
    description: "Historic Red Horse Monument landmark"
  },
  {
    id: 'san-ildefonso-basc',
    name: "Bulacan Agricultural State College, Main Campus",
    category: 'San Ildefonso',
    latitude: 15.073340554475491,
    longitude: 120.95695658465743,
    address: "Bulacan Agricultural State College, Main Campus, San Ildefonso, Bulacan",
    description: "Main campus of Bulacan Agricultural State College"
  },
  {
    id: 'san-ildefonso-ministop',
    name: "Old Ministop",
    category: 'San Ildefonso',
    latitude: 15.077388630676394,
    longitude: 120.94174193757298,
    address: "Old Ministop, San Ildefonso, Bulacan",
    description: "Convenience store location in San Ildefonso"
  },
  {
    id: 'san-rafael-nesabel',
    name: "NESABEL Drugstore",
    category: 'San Rafael',
    latitude: 15.027380609998,
    longitude: 120.93456665582181,
    address: "NESABEL Drugstore, San Rafael, Bulacan",
    description: "Local drugstore in San Rafael"
  }
];

// Function to get all pin locations
export const getPinLocations = (): PinLocation[] => {
  return PIN_LOCATIONS;
};

// Function to get pin locations by category
export const getPinLocationsByCategory = (category: string): PinLocation[] => {
  return PIN_LOCATIONS.filter(location => location.category === category);
};

// Function to find pin location by ID
export const getPinLocationById = (id: string): PinLocation | undefined => {
  return PIN_LOCATIONS.find(location => location.id === id);
};

// Function to check if location is within Bulacan bounds
export const isWithinBulacan = (location: { latitude: number; longitude: number }): boolean => {
  // Approximate bounds for Bulacan Province
  const bounds = {
    north: 15.3,
    south: 14.7,
    east: 121.2,
    west: 120.7
  };
  
  return (
    location.latitude >= bounds.south &&
    location.latitude <= bounds.north &&
    location.longitude >= bounds.west &&
    location.longitude <= bounds.east
  );
};

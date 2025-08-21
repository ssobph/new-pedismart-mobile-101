import { router } from "expo-router";
import { api } from "./apiInterceptors";
import { Alert } from "react-native";
import { resetAndNavigate } from "@/utils/Helpers";

interface coords {
  address: string;
  latitude: number;
  longitude: number;
}

export const createRide = async (payload: {
  vehicle: "bike" | "auto" | "cabEconomy" | "cabPremium";
  pickup: coords;
  drop: coords;
}) => {
  try {
    const res = await api.post(`/ride/create`, payload);
    router?.navigate({
      pathname: "/customer/liveride",
      params: {
        id: res?.data?.ride?._id,
      },
    });
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log("Error:Create Ride ", error);
  }
};

export const getMyRides = async (isCustomer: boolean = true) => {
  try {
    const res = await api.get(`/ride/rides`);
    const filterRides = res.data.rides?.filter(
      (ride: any) => ride?.status != "COMPLETED"
    );
    if (filterRides?.length > 0) {
      router?.navigate({
        pathname: isCustomer ? "/customer/liveride" : "/rider/liveride",
        params: {
          id: filterRides![0]?._id,
        },
      });
    }
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log("Error:GET MY Ride ", error);
  }
};

export const acceptRideOffer = async (rideId: string) => {
  try {
    const res = await api.patch(`/ride/accept/${rideId}`);
    resetAndNavigate({
      pathname: "/rider/liveride",
      params: { id: rideId },
    });
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log(error);
  }
};

export const updateRideStatus = async (rideId: string, status: string) => {
  try {
    const res = await api.patch(`/ride/update/${rideId}`, { status });
    return true;
  } catch (error: any) {
    Alert.alert("Oh! Dang there was an error");
    console.log(error);
    return false;
  }
};

export const getRideHistory = async (status?: string) => {
  try {
    const queryParams = status ? `?status=${status}` : '';
    const res = await api.get(`/ride/rides${queryParams}`);
    return res.data.rides || [];
  } catch (error: any) {
    console.log("Error: Get Ride History ", error);
    Alert.alert("Error", "Failed to fetch ride history");
    return [];
  }
};

// Rating related functions
export const submitRating = async (rideId: string, rating: number, comment?: string) => {
  try {
    const res = await api.post('/rating/create', {
      rideId,
      rating,
      comment
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    console.log("Error: Submit Rating ", error);
    Alert.alert("Error", "Failed to submit rating");
    return { success: false, error };
  }
};

export const checkRideRating = async (rideId: string) => {
  try {
    const res = await api.get(`/rating/check/${rideId}`);
    return { rated: res.data.rated, rating: res.data.rating };
  } catch (error: any) {
    console.log("Error: Check Ride Rating ", error);
    return { rated: false, rating: null };
  }
};

export const getRiderRatings = async (riderId: string) => {
  try {
    const res = await api.get(`/rating/rider/${riderId}`);
    return res.data;
  } catch (error: any) {
    console.log("Error: Get Rider Ratings ", error);
    Alert.alert("Error", "Failed to fetch rider ratings");
    return { count: 0, averageRating: 0, ratings: [] };
  }
};

export const getMyRatings = async () => {
  try {
    const res = await api.get('/rating/my-ratings');
    return res.data;
  } catch (error: any) {
    console.log("Error: Get My Ratings ", error);
    Alert.alert("Error", "Failed to fetch your ratings");
    return { count: 0, averageRating: 0, ratings: [] };
  }
};

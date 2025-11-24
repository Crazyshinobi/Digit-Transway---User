import axios from "axios";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export const getGeocode = async (
  address: string
): Promise<GeocodeResult> => {
  try {
    const GOOGLE_API_KEY = "AIzaSyDnrWUIvxphrz5qBWOyQX8SpOfG8LIlXdA"; // replace with env

    // Validate
    if (!address || address.trim().length === 0) {
      throw new Error("Address is required.");
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status === "ZERO_RESULTS") {
      throw new Error("No matching location found for this address.");
    }

    if (response.data.status !== "OK") {
      throw new Error(
        `Google API Error: ${response.data.status} - ${response.data.error_message || ""}`
      );
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error: any) {
    console.error("Geocode Error:", error.message || error);
    throw new Error(error.message || "Failed to fetch geocode.");
  }
};

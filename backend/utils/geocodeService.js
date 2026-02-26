import axios from "axios";

export const getLocationName = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      "https://api.opencagedata.com/geocode/v1/json",
      {
        params: {
          key: process.env.OPENCAGE_API_KEY,
          q: `${latitude},${longitude}`,
        },
      }
    );

    if (!response.data.results.length) {
      return "Location not found";
    }

    return response.data.results[0].formatted;

  } catch (error) {
    console.error("OpenCage error:", error.message);
    return "Location fetch failed";
  }
};
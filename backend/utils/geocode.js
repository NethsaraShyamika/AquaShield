export const getAreaName = async (lat, lng) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error(error.message);
    return null;
  }
};

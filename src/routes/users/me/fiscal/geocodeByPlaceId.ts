import { AddressType, Client } from "@googlemaps/google-maps-services-js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export default async function geocodePlaceId(placeId: string) {
  console.info("geocodePlaceId", placeId);
  console.info("env", process.env.GOOGLE_API_KEY);
  const axiosInstance = axios.create({
    headers: {
      locale: "it",
      "Accept-Language": "it-IT,it;",
    },
  });

  //@ts-ignore
  const client = new Client({ axiosInstance });
  try {
    const results = await client.geocode({
      params: {
        key: process.env.GOOGLE_API_KEY || "",
        place_id: placeId,
      },
    });
    console.log("results clientGeocode", results);
    console.log("results clientGeocode data", results.data);
    console.log("results clientGeocode data.results", results.data.results);
    const addressComponents = results.data.results[0].address_components;

    const cityData = addressComponents.find((c) =>
      c.types.includes("locality" as AddressType)
    );

    const city = cityData ? cityData.long_name : undefined;

    const countryData = addressComponents.find((c) =>
      c.types.includes("country" as AddressType)
    );

    const country = countryData ? countryData.short_name : undefined;
    let province = "EE";
    if (country === "IT") {
      const provinceData = addressComponents.find((c) =>
        c.types.includes("administrative_area_level_2" as AddressType)
      );
      if (provinceData) {
        province = provinceData.short_name;
      }
    }
    console.info("geocoding", { city, province });
    return { city, province };
  } catch (e) {
    console.error("GeocodeByPlaceId", e);
    return false;
  }
}

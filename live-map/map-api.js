import { GOOGLE_MAPS_API_KEY, MAP_ID } from "../config/config.js";

export function getUserLocation(callback) {
  const defaultLocation = { lat: 49.2250505, lng: -123.1074575 }; // Default Location : Langara College

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      // success
      function (position) {
        console.log("Lat:", position.coords.latitude);
        console.log("Lng:", position.coords.longitude);
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        callback(userLocation);
      },
      //error
      function (error) {
        console.error(error);
        callback(defaultLocation);
      }
    );
  } else {
    console.log("This browser does not support geolocation.");
    callback(defaultLocation);
  }
}

export function loadGoogleMapScript(callback) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google MAP API Key is not correctly input.");
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=marker,places,geometry`;
  script.async = true;
  script.defer = true;
  document.head.append(script);
}

export function startUserPositionUpdates(map) {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (userMarker) {
          userMarker.position = pos;
        }
      },
      (error) => {
        console.error("Error in watchPosition:", error);
      }
    );
  }
}

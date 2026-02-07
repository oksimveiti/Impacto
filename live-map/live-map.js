//get API Key
import { GOOGLE_MAPS_API_KEY, MAP_ID, auth } from "../config/config.js";
import {
  getUserLocation,
  loadGoogleMapScript,
  startUserPositionUpdates,
} from "./map-api.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { db } from "../config/config.js";
import {
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

let userMarker = null; // marker for user
let isMapVisible = false;

// ボタンクリックのイベントリスナーを追加
document.addEventListener("DOMContentLoaded", () => {
  const showMapButton = document.getElementById("show-live-map");
  const liveMapDiv = document.getElementById("live-map");

  showMapButton.addEventListener("click", () => {
    isMapVisible = !isMapVisible;
    liveMapDiv.style.display = isMapVisible ? "block" : "none";
    showMapButton.classList.toggle("hidden", isMapVisible);

    // マップが表示されたときに初期化
    if (isMapVisible && !liveMapDiv.hasAttribute("data-initialized")) {
      initLiveMap();
      liveMapDiv.setAttribute("data-initialized", "true");
    }
  });
});

window.initLiveMap = async function () {
  const eventId = getEventId();
  const eventLocation = await fetchEventLocation(eventId);

  console.log("Initializing live map with location:", eventLocation);
  console.log("Map element exists:", !!document.getElementById("live-map"));

  if (!eventLocation) {
    console.error("Error: Failed to fetch event location.");
    return;
  }

  const liveMap = new google.maps.Map(document.getElementById("live-map"), {
    center: eventLocation,
    zoom: 13.5,
    mapId: MAP_ID,
  });

  new google.maps.Marker({
    position: eventLocation,
    map: liveMap,
    title: "Event Location",
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      labelOrigin: new google.maps.Point(80, 16),
    },
  });

  getUserLocation(function (userLocation) {
    console.log("getUserLocation-userLocation:", userLocation)
    if (
      !userLocation ||
      typeof userLocation.lat !== "number" ||
      typeof userLocation.lng !== "number"
    ) {
      console.error("Error: Invalid user location received:", userLocation);
      return;
    }

    // Add marker for the user's location
    console.log("google.maps.marker:", google.maps.marker);
    console.log("google.maps.advancedMarker:", google.maps.advancedMarker);
    // userMarker = new google.maps.marker.AdvancedMarkerElement({
      userMarker = new google.maps.Marker({
      position: userLocation,
      map: liveMap,
      title: "Your current location.",
      // icon:{}
    });

    console.log("google.maps:", google.maps);
console.log("google.maps.LatLngBounds:", google.maps.LatLngBounds);
console.log("typeof google.maps.LatLngBounds:", typeof google.maps.LatLngBounds);


    const bounds = new google.maps.LatLngBounds();
    bounds.extend(eventLocation);
    bounds.extend(userLocation);
    setTimeout(() => {
      liveMap.fitBounds(bounds, 0)
    }, 100)
    

    //Update user's location realtime
    // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
    // https://developers.google.com/maps/documentation/javascript/examples/map-geolocation
    // The watchPosition() method of the Geolocation interface is used to register a handler function that will be called automatically each time the position of the device changes.
    startUserPositionUpdates(liveMap);
  });

  //get Firestore Data
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is signed in:", user.uid);
      await fetchEventLocation(eventId);
    } else {
      console.log("No user is signed in. Redirecting to login...");
    }
  });
};

function getEventId() {
  // グローバル変数からイベントIDを取得
  const eventId = window.currentEventId;
  console.log("Getting Event ID:", eventId); // デバッグ用

  if (!eventId) {
    console.error("No event ID available");
    return null;
  }

  return eventId;
}

async function fetchEventLocation(eventId) {
  if (!db) {
    console.error("Firestore DB instance is missing!");
    return null;
  }

  const eventReference = doc(db, "events", eventId);
  const querySnapshot = await getDoc(eventReference);

  if (querySnapshot.exists()) {
    const eventData = querySnapshot.data();
    console.log("Event data from Firebase:", eventData);

    if (
      !eventData.location ||
      typeof eventData.location.latitude !== "number" ||
      typeof eventData.location.longitude !== "number"
    ) {
      console.error(
        "Location data in Firebase is not correct",
        eventData.location
      );
      return null;
    }

    let lat = eventData.location.latitude;
    let lng = eventData.location.longitude;
    return { lat, lng };
  } else {
    console.error("Event data not found");
    return null;
  }
}

if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
  loadGoogleMapScript(initLiveMap); //loadGoogleMapScript => initLiveMap
} else {
  console.log("Google Maps API is already loaded. Running initLiveMap.");
  initLiveMap();
}

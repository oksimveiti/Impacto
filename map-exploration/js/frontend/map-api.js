//get API Key
import { GOOGLE_MAPS_API_KEY, MAP_ID, auth } from "../../../config/config.js";
import { fetchEventsForMap } from "../backend/firestore.js";
import { trackApiUsage } from "./monitor-api.js";
import { trackFirestoreUsage } from "./monitor-api.js";
import { createEventCard } from "./eventcard.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { db } from "../../../config/config.js";
import {
  collection,
  query,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { applyFilters } from "./sort-and-filter.js";
import { getFilteredEvents } from "./sort-and-filter.js"

const mapListSwitchBtn = document.getElementById("switch-view-button");
mapListSwitchBtn.addEventListener("click", () => {
  console.log("clicked");
  window.location.href = "http://127.0.0.1:5504/list-view/html/list-view.html";
});

export let map;
const allEventsArray = JSON.parse(localStorage.getItem("allEventsData")) || [];
let mapInstance = null;
let userPositionWatcher = null; // id by watchPosition()
// let eventUpdateInterval = null; // id by setInterval()
let isRealtimeUpdating = true; // realtime update status
let userMarker = null; // marker for user

export const eventMarkers = [];

//Insert script tag in html file to use Google Maps API
export function loadGoogleMapScript(callback) {
  //Error handling
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google MAP API Key is not correctly input.");
    return;
  }

  // script tag
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=marker`; //callback: "initMap"
  script.async = true;
  script.defer = true;
  document.head.append(script);
}

// Initialize Google Maps and Firebase
// This will be excuted in getUserLocation and Event Data

window.initMap = function initMap() {
  console.log("+++++initMap+++++");
  if (map && map instanceof google.maps.Map) {
    console.warn("Map is already initialized.");
    return;
  }

  trackApiUsage(); //For development purpose

  getUserLocation(function (userLocation) {
    // Create and display map
    map = new google.maps.Map(document.getElementById("map"), {
      center: userLocation,
      zoom: 10,
      mapId: MAP_ID,
      gestureHandling: "auto",
      scrollwheel: true,
      draggable: true,
      disableDefaultUI: false,
    });

    // Add marker for the user's location
    userMarker = new google.maps.marker.AdvancedMarkerElement({
      position: userLocation,
      map: map,
      title: "Your current location.",
    });

    //Update user's location realtime
    // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
    // https://developers.google.com/maps/documentation/javascript/examples/map-geolocation
    // The watchPosition() method of the Geolocation interface is used to register a handler function that will be called automatically each time the position of the device changes.
    startRealtimeUpdates(map);
  });

  //get Firestore Data
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is signed in:", user.uid);
      await getEventInformation();

      startEventUpdates(map);
      map.setOptions({ scrollwheel: true, gestureHandling: "auto" });
    } else {
      console.log("No user is signed in. Redirecting to login...");
    }
  });
};

const eventMarkersMap = {};

function startEventUpdates(map) {
  if (!map) {
    console.warn("Map instance is invalid in startEventUpdates.");
    return;
  }

  // watch Firestore events collection
  const eventsCollectionRef = collection(db, "events");
  const q = query(eventsCollectionRef);

  // set onSnapshot for realtime update
  onSnapshot(q, (snapshot) => {
    let allEvents = [];

    snapshot.docChanges().forEach((change) => {
      const event = { id: change.doc.id, ...change.doc.data() };

      if (!event.location) {
        console.warn(
          `Skipping event "${event.title}" due to missing location data.`
        );
        return;
      }

      if (change.type === "added" || change.type === "modified") {
        allEvents.push(event);
      } else if (change.type === "removed") {
        removeEventMarker(event.id);
      }
    });
    const filteredEvents = getFilteredEvents();
    updateMapMarkers(filteredEvents);
    map.setOptions({ scrollwheel: true, gestureHandling: "auto" });
  });
}

function addEventMarker(event) {
  if (!map) return;

  const marker = new google.maps.Marker({
    position: event.location,
    map: map,
    title: event.title,
    label: {
      text: event.participants
        ? `participants: ${event.participants.length}`
        : "participants: 0",
      color: "black",
      fontSize: "12px",
      fontWeight: "normal",
      className: "custom-label",
    },
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      labelOrigin: new google.maps.Point(80, 16),
    },
  });

  const eventInfoWindow = new google.maps.InfoWindow({
    content: `
      <section class="event-info-window">
        <img src=${event.image_url} alt=${event.title} />
        <div class="info-container">
          <h3>${event.title}</h3>
          <p>${event.description}</p>
          <p>${new Date(event.date_time).toLocaleString()}</p>
        </div>
      </section>
    `,
  });

  marker.addListener("click", function () {
    eventInfoWindow.open(map, marker);
  });

  eventMarkersMap[event.id] = marker;
}

function updateEventMarker(event) {
  if (!map) return;
  removeEventMarker(event.id);
  addEventMarker(event);
}

function removeEventMarker(eventId) {
  if (eventMarkersMap[eventId]) {
    eventMarkersMap[eventId].setMap(null);
    delete eventMarkersMap[eventId];
  }
}

export function startUserPositionUpdates(map) {
  if (userPositionWatcher !== null) {
    return;
  }

  userPositionWatcher = navigator.geolocation.watchPosition(
    // success
    function (position) {
      const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (userMarker) {
        userMarker.map = null; //cannot overwrite
      }

      userMarker = new google.maps.marker.AdvancedMarkerElement({
        position: newPosition,
        map: map,
        title: "Your current location.",
      });
      map.setCenter(newPosition);
    },
    // error
    function () {
      console.error("User position update failed.");
    }
  );
}

export function stopRealtimeUpdates() {
  if (isRealtimeUpdating) {
    isRealtimeUpdating = false;

    if (userPositionWatcher !== null) {
      navigator.geolocation.clearWatch(userPositionWatcher);
      userPositionWatcher = null;
      console.log("User position updates have been stopped.");
    }

    if (eventUpdateInterval !== null) {
      clearInterval(eventUpdateInterval);
      eventUpdateInterval = null;
      console.log("Event updates have been stopped.");
    }
  } else {
    console.log("Real-time updates are already stopped.");
  }
}

export function startRealtimeUpdates(map) {
  if (!map) {
    console.log("Cannot update");
    return;
  }

  if (!isRealtimeUpdating) {
    isRealtimeUpdating = true;
    console.log("Real-time updates have been started.");
  }
  startUserPositionUpdates(map);
  startEventUpdates(map);
}

// Get user's Location
// getUserLocation receives callback function(=initMap). After getting user's location, excute callback(userLocation). callback(userLocation) means initMap(userLocation)
export function getUserLocation(callback) {
  const defaultLocation = { lat: 49.2250505, lng: -123.1074575 }; // Default Location : Langara College

  // navigator.geolocation is an emebeded global object in Javascript. Can be used without declaration
  if (navigator.geolocation) {
    // getCurrentPosition(success, error, options)
    navigator.geolocation.getCurrentPosition(
      // success
      function (position) {
        console.log("Lat:", position.coords.latitude);
        console.log("Lng:", position.coords.longitude);
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        callback(userLocation); // execute initMap(userLocation). callback is initMap() because initMap calls getUserLocation, and getUserLocation is callback function.
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

// Get information of each event
// let newMap = new Map();

async function getEventInformation() {
  if (!map || !(map instanceof google.maps.Map)) {
    console.error("Error: Map instance is invalid inside getEventInformation.");
    console.trace();
    return;
  }

  try {
    const events = await fetchEventsForMap();

    for (const event of events) {
      // add marker on map

      if (!event.location) {
        console.warn(
          `Skipping event "${event.title}" due to missing location data.`
        );
        continue;
      }

      const eventMarker = new google.maps.Marker({
        position: event.location,
        map: map,
        title: event.title,
        label: {
          text: event.participants
            ? `participants: ${event.participants.length}`
            : "participants: 0",
          color: "black",
          fontSize: "12px",
          fontWeight: "normal",
          className: "custom-label",
        },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          labelOrigin: new google.maps.Point(80, 16),
        },
      });
      eventMarkers.push(eventMarker);
      trackApiUsage();

      const eventInfoWindow = new google.maps.InfoWindow({
        content: `
        <section class="event-info-window">
          <img src=${event.image_url} alt=${event.title} image>
          <div class="info-container">
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <p>${new Date(event.date_time).toLocaleString()}</p>
          </div>
        </section>
        `,
      });

      eventMarker.addListener("click", function () {
        eventInfoWindow.open(map, eventMarker);
      });
    }
  } catch (error) {
    console.error("Error fetching event data from Firestore:", error);
  }
}

export function getMapInstance() {
  return mapInstance;
}

// function initializeEventCard() {
//   console.log("initializing event card")
//   for (let i = 0; i < sessionStorage.length; i++) {
//     const key = sessionStorage.key(i);
//     console.log("Creating cards!");
//     allEventsArray
//     try {
//       const item = sessionStorage.getItem(key);
//       if (!item) {
//         console.warn(`No data found for key: ${key}`);
//         continue;
//       }

//       // If this is error, it's not an event.
//       const dataFromSessionStorage = JSON.parse(sessionStorage.getItem(key));
//       if (
//         typeof dataFromSessionStorage === "object" &&
//         !Array.isArray(dataFromSessionStorage)
//       ) {
//         if ( dataFromSessionStorage.status !== "publish" && dataFromSessionStorage.status !== "published") {
//           createEventCard(dataFromSessionStorage, dataFromSessionStorage.id, "event-card-section");
//         }
//       }
//     } catch (error) {
//       // Nothing to do because all of event data are objects, and if it is error, that it not event data.
//       console.log(error);
//     }
//   }
// }

function createCardsForAll() {
  console.log("creating cards!!!++++++++");
  console.log(allEventsArray);
  for (const eachEvent of allEventsArray) {
    if (eachEvent.status === "publish" || eachEvent.status === "published") {
      createEventCard(eachEvent, eachEvent.id, "event-cards-all");
    } else {
      continue;
    }
  }
}

loadGoogleMapScript(initMap);
createCardsForAll();

let checkEventThenInitialize = setInterval(() => {
  if (sessionStorage.getItem("0") !== null) {
    clearInterval(checkEventThenInitialize);
  }
}, 10000);

function updateMapMarkers(filteredEvents) {
  if (!map || !(map instanceof google.maps.Map)) {
    console.error("Error: Map instance is invalid inside updateMapMarkers.");
    return;
  }

  deleteAllEventMarkers();

  for (let eachEvent of filteredEvents) {
    addEventMarker(eachEvent);
  }
}


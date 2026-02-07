// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { firebaseConfig } from "../../../config/config.js";
import { trackFirestoreUsage } from "../frontend/monitor-api.js";
import { db } from "../../../config/config.js";

// const app = initializeApp(firebaseConfig); // initialize Firebase and connect app with Firebase
// const db = getFirestore(app); // get instance of Firestore. In other words, get database in firestore => editable

document.addEventListener("DOMContentLoaded", () => {
  trackFirestoreUsage();
  trackFirestoreUsage();
});

// get data collection of events from Firestore
export async function fetchEventsForMap() {
  
  if (!db) {
    console.error("Firestore DB instance is missing!");
    return [];
  }
  
  // count number of fetch. Update Event info other than location for the first time only.
  const firestoreCallCount = parseInt(
    sessionStorage.getItem("firestoreCallCount") || "0"
  );

  const querySnapshot = await getDocs(collection(db, "events"));
  trackFirestoreUsage();
  let events = [];

  // document means data record in Firestore. Documents are events in this application.
  for (const document of querySnapshot.docs) {
    // convert the location data from GeoPoint type to {lat, lng}
    const eventData = document.data();

    if (eventData.location && typeof eventData.location.latitude === "number" && typeof eventData.location.longitude === "number") {
      eventData.location = {
          lat: eventData.location.latitude,
          lng: eventData.location.longitude,
      };
  } else {
      console.warn("Invalid location data for event:", eventData);
      eventData.location = null;
  }
  
    events.push({
      id: document.id, //  "...document.data()" does not include document.id
      ...eventData,
    });
  }

  let i = 0;
  for (let event of events) {
    sessionStorage.setItem(i, JSON.stringify(event));
    i++;
  }
  console.log("firebaseCallCount: " + firestoreCallCount);
  console.log("fetchEventsForMap() is returning:", events);
  return events;
}

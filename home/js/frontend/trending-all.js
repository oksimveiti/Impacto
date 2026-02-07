import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { db, auth } from "../../../config/config.js";
import { createEventCard } from "../../../map-exploration/js/frontend/eventcard.js";

// const eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
const eventCache = new Map(); // Cache for event documents
const allEventsArray = await fetchEventsForHome();

console.log("allEventArray: ", allEventsArray);

async function fetchEventsForHome() {
  if (!db) {
    console.error("Firestore DB instance is missing!");
    return [];
  }

  const querySnapshot = await getDocs(collection(db, "events"));
  let events = [];

  // document means data record in Firestore. Documents are events in this application.
  for (const document of querySnapshot.docs) {
    // convert the location data from GeoPoint type to {lat, lng}
    const eventData = document.data();
    console.log(eventData);

    if (
      eventData.location &&
      typeof eventData.location.latitude === "number" &&
      typeof eventData.location.longitude === "number"
    ) {
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
  console.log("Fetched Events from Firestore:", events);

  let i = 0;
  for (let event of events) {
    sessionStorage.setItem(i, JSON.stringify(event));
    i++;
  }

  console.log("fetchEventsForMap() is returning:", events);
  return events;
}

createCardsForTrend();

function createCardsForTrend() {
  const sortedbyParticipantsArray = allEventsArray
    .slice() // create new array by copying allEventsArray
    .sort((a, b) => b.participants - a.participants); //Sort descendant order
  for (let i = 0; i < 10; i++) {
    createEventCard(sortedbyParticipantsArray[i], sortedbyParticipantsArray[i].id, "event-cards-trending");
  }
}

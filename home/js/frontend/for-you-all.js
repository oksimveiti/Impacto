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
const allEventsArray = JSON.parse(localStorage.getItem("allEventsData") || "[]");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User ID:", user.uid);
  } else {
    console.log("User is logged out.");
    return;
  }

  async function getEventIdsByUserInterests() {
    try {
      const uid = user.uid;
      const userProfileDocRef = doc(db, "profile_setup", uid);
      const userProfileDocSnapshot = await getDoc(userProfileDocRef);

      if (!userProfileDocSnapshot.exists()) {
        console.log("User profile not found.");
        return [];
      }

      const userData = userProfileDocSnapshot.data();
      const interests = userData.interests || {};
      const eventPreferences = interests.eventPreferences || [];

      if (eventPreferences.length === 0) {
        console.log("User's event preferences not found.");
        return [];
      }

      const interestedEventIds = [];
      const promises = eventPreferences.map(async (category) => {
        const eventsRef = collection(db, "events");
        const q = query(
          eventsRef,
          where("event_categories", "array-contains", category)
        );
        const eventsSnapshot = await getDocs(q);
        for (const doc of eventsSnapshot.docs) {
          // Use for...of loop
          interestedEventIds.push(doc.id);
        }
      });

      await Promise.all(promises); // Execute queries in parallel

      return interestedEventIds;
    } catch (error) {
      console.error("Error getting event IDs:", error);
      return [];
    }
  }

  const interestedEventIdsTemp = await getEventIdsByUserInterests();
  const interestedEventIds = [...new Set(interestedEventIdsTemp)];
  console.log("Retrieved event IDs:", interestedEventIdsTemp);
  console.log("Retrieved event IDs:", interestedEventIds);

  if (interestedEventIds.length > 0) {

    const promises = interestedEventIds.map(async (eventId) => {
      try { 
        let eventDocSnapshot;
        if (eventCache.has(eventId)) {
          // Check cache
          eventDocSnapshot = eventCache.get(eventId);
        } else {
          const eventDocRef = doc(db, "events", eventId);
          eventDocSnapshot = await getDoc(eventDocRef);
          eventCache.set(eventId, eventDocSnapshot); // Save to cache
        }

        if (eventDocSnapshot.exists()) {
          const eventData = eventDocSnapshot.data();
          const title = eventData.title;

          const titleButton = document.createElement("button");
          titleButton.textContent = title;

          titleButton.addEventListener("click", () => {
            // window.location.href = eventHref;
            window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
          });
          console.log(eventId);
          createEventCard(eventData, eventId, "event-cards-for-you");
        } else {
          console.log(`Event document with ID ${eventId} not found.`);
        }
      } catch (error) {
        console.error(`Error getting title for event ID ${eventId}:`, error);
      }
    });

    await Promise.all(promises); // Execute document retrievals in parallel
  } else {
    console.log("No events to display.");
  }
});
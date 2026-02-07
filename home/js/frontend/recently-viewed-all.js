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

// const eventHref = `http://127.0.0.1:5500/create-event-Naomi/html/event-detail.html?id=${eventId}`;

// const allEventsArray = await fetchEventsForHome();
const recentlyViewedEventsArray = JSON.parse(
  localStorage.getItem("recentlyViewed") || "[]"
);
let uniqueRecentlyViewedEvents = [];

const deleteHistoryBtn = document.getElementById("delete-history");
const eventCardsArea = document.getElementById("event-cards-recently-viewed");

deleteHistoryBtn.addEventListener("click", deleteHistory);

function deleteHistory() {
  eventCardsArea.innerHTML = "";
  const displayP = document.getElementById("number-of-posts");
  const numOfCards = 0;

  const noCardsDisplay = document.createElement("p");
  noCardsDisplay.textContent = "No recently viewed events";
  noCardsDisplay.classList.add("no-card-message");
  eventCardsArea.append(noCardsDisplay);

  displayP.textContent = `All posts (${numOfCards})`;
  localStorage.removeItem("recentlyViewed");
}

async function initializeRecentlyViewedAll() {
  const noCardsDisplay = document.getElementById("no-card-message");
  const multiple = new Set(); //Set.has returns whether it already has the data
  uniqueRecentlyViewedEvents = recentlyViewedEventsArray.filter(
    (eachEvent) => {
      //filter by conditions
      if (multiple.has(eachEvent.id)) {
        return false; // ommited by filter
      } else {
        multiple.add(eachEvent.id); // add to Set
        return true; // kept by filter
      }
    }
  );
  if (noCardsDisplay) {
    noCardsDisplay.remove();
  }
  await createCardsForRecentlyViewed();
  await createNumberOfCardDisplay();
}

function createCardsForRecentlyViewed() {
  for (const eachEvent of uniqueRecentlyViewedEvents) {
    createEventCard(eachEvent, eachEvent.id, "event-cards-recently-viewed");
  }
}

function createNumberOfCardDisplay() {
  const displayP = document.getElementById("number-of-posts");
  const numOfCards = eventCardsArea.querySelectorAll("event-cards").length;

  displayP.textContent = `All posts (${numberOfCards})`;
}

initializeRecentlyViewedAll();

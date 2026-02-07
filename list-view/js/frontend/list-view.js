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
  
  const mapListSwitchBtn = document.getElementById("switch-view-button");
  mapListSwitchBtn.addEventListener("click", () => {
    console.log("clicked");
    window.location.href = "http://127.0.0.1:5504/map-exploration/html/map-view-with-list.html"
  });

  const allEventsArray = JSON.parse(localStorage.getItem("allEventsData")) || [];
  console.log("allEventArray: ", allEventsArray);

  createCardsForAll();
  
  function createCardsForAll() {

    const uniqueAllEventsArray = [...new Set(allEventsArray)]

    for ( const eachEvent of uniqueAllEventsArray ) {
      if (eachEvent.status === "publish" || eachEvent.status === "published") {
        createEventCard(eachEvent, eachEvent.id, "event-cards-all");
      } else {
        continue;
      }
    }
  }
import { createEventCard } from "../../../map-exploration/js/frontend/eventcard.js";

displaySearchedEvents();

function displaySearchedEvents() {
    console.log("displaying searched events...")
    debugger;
    let searchedEvents = [];
    if(sessionStorage.getItem("searchedEvents") === null) {
        const eventCardSection = document.getElementById("event-card-section");
        const noEventMessage = document.createElement("p");
        noEventMessage.id = "no-event-message"
        noEventMessage.textContent = "No reseach result found."
        eventCardSection.append(noEventMessage);
        return;
    } else {
         searchedEvents = JSON.parse(sessionStorage.getItem("searchedEvents"));
    }

    for ( const searchedEvent of searchedEvents) {
        createEventCard(searchedEvent, searchedEvent.id, "event-card-section");
    }
    sessionStorage.removeItem("searchedEvents");
}
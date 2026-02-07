import { createEventCard } from "./eventcard.js";
import { eventMarkers } from "./map-api.js";
import { map } from "./map-api.js";

const filterMenuBtn = document.getElementById("filter-menu-btn");
const filterMenu = document.getElementById("filter-menu");
const allEventsArray = [];
filterMenuBtn.addEventListener("click", showFilterMenu);

function showFilterMenu() {
  filterMenu.classList.toggle("active");
  generateAllEventArray();
  createCityOptions();
  addFilterEventListeners();
}

export function generateAllEventArray() {
  if (allEventsArray.length !== 0) {
    return;
  }

  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);

    try {
      const value = JSON.parse(sessionStorage.getItem(key)); // If this is error, it's not an event.
      for (let i = 0; i < value["event_categories"].length; i++) {
        value["event_categories"][i] =
          value["event_categories"][i].toLowerCase();
      }
      allEventsArray.push(value);
    } catch {
      // nothing to do
    }
  }
}

// Filter options in side menu
function createCityOptions() {
  const cityUl = document.getElementById("filter-city-ul");

  if (cityUl.children.length > 0) {
    return;
  }

  const storedCities = [];

  for (let event of allEventsArray) {
    if (event.city === undefined) {
      continue;
    }

    if (event.status !== "publish" && event.status !== "published") {
      continue;
    }

    if (storedCities.includes(event.city.toLowerCase())) {
      continue;
    }
    storedCities.push(event.city.toLocaleLowerCase());
    const cityLi = document.createElement("li");
    const cityLabel = document.createElement("label");
    const checkBox = document.createElement("input");

    cityLi.id = "filter-cities-" + event.city.toLowerCase();
    cityLi.classList.add("filter-options", "filter-options-city");
    cityLabel.textContent = event.city;
    cityLabel.htmlFor = "filter-cities-" + event.city.toLowerCase() + "-input";
    cityLabel.classList.add("filter-options");
    checkBox.id = "filter-cities-" + event.city.toLowerCase() + "-input";
    checkBox.type = "checkbox";

    cityLi.append(cityLabel);
    cityLi.append(checkBox);
    cityUl.append(cityLi);

    // cityLi.addEventListener("click", filterEvents);
    // cityLabel.addEventListener("click", function (event) {
    //   event.stopPropagation();
    // });

    cityLabel.addEventListener("click", function (event) {
      event.preventDefault();
      checkBox.checked = !checkBox.checked; 
      filterEvents({ currentTarget: checkBox }); 
    });

    checkBox.addEventListener("click", function (event) {
      event.stopPropagation(); // prevent event happens set in parents
      filterEvents({ currentTarget: checkBox }); 
    });

  }
}

function addFilterEventListeners() {
  document.querySelectorAll(".filter-options").forEach((filterOption) => {
    if (filterOption.classList.contains("filter-options-city")) {
      return;
    }
    if (!filterOption.hasAttribute("data-click-listener")) {
      filterOption.setAttribute("data-click-listener", "true");
      filterOption.addEventListener("click", filterEvents);
    }
  });
}

// Filter buttons on top
const buttonFilters = document.querySelectorAll(".button-filter-options");

for (let buttonFilter of buttonFilters) {
  buttonFilter.addEventListener("click", buttonfilterEvents);
}

export let filteredEvents = [];

function buttonfilterEvents(event) {
  event.currentTarget.classList.toggle("category-btn-selected");

  //get filtered condition
  const categoryBtns = document.querySelectorAll(".button-filter-options");
  const selectedCategoryBtns = [];

  for (let categoryBtn of categoryBtns) {
    if (categoryBtn.classList.contains("category-btn-selected")) {
      selectedCategoryBtns.push(categoryBtn.id);
    }
  }

  //get all event data
  generateAllEventArray();

  // If no category buttons are selected, display all cards
  if (selectedCategoryBtns.length === 0) {
    //Initialize: delete all cards
    const allCards = document.querySelectorAll(".event-cards");
    for (let card of allCards) {
      card.remove();
    }

    for (let eachEvent of allEventsArray) {
      createEventCard(eachEvent, eachEvent.id, "event-cards-all");
    }
    updateMapMarkers(allEventsArray);
    return;
  }

  //extract event data
  const extractedEvents = [];
  for (let eachEvent of allEventsArray) {
    for (let i = 0; i < eachEvent["event_categories"].length; i++) {
      if (selectedCategoryBtns.includes(eachEvent["event_categories"][i])) {
        extractedEvents.push(eachEvent);
      }
    }
  }

  //Initialize: delete all cards
  const allCards = document.querySelectorAll(".event-cards");
  for (let card of allCards) {
    card.remove();
  }

  //Create filtered cards
  for (let eachEvent of extractedEvents) {
    createEventCard(eachEvent, eachEvent.id, "event-cards-all");
  }
  updateMapMarkers(extractedEvents);
}

// Filtering functions
function filterEvents(event) {
  const targetElement = event.currentTarget;
  //use setTimeout to wait to reflect the changed checkbox status
  setTimeout(() => {
    let checkbox = null;
    if (
      targetElement.tagName === "INPUT" &&
      targetElement.type === "checkbox"
    ) {
      checkbox = targetElement;
    } else {
      checkbox = targetElement
        .closest("li")
        .querySelector("input[type='checkbox']");
    }

    if (!checkbox) {
      return;
    }

    filteredEvents = [];

    //get filtered condition
    const selectedTypes = [];
    const selectedCities = [];
    const selectedDates = [];
    const selectedTimeOfDay = [];
    const selectedCategories = [];
    const typeOptions = document
      .getElementById("filter-type-ul")
      .querySelectorAll(".filter-options-type");
    const cityOptions = document
      .getElementById("filter-city-ul")
      .querySelectorAll(".filter-options-city");
    const dateOptions = document
      .getElementById("filter-date-ul")
      .querySelectorAll(".filter-options-date");
    const timeOptions = document
      .getElementById("filter-time-ul")
      .querySelectorAll(".filter-options-time");
    const categoryOptions = document
      .getElementById("filter-category-ul")
      .querySelectorAll(".filter-options-category");

    // store selected types
    for (let typeOption of typeOptions) {
      const checkBox = typeOption.querySelector("input[type='checkbox']");
      const label = typeOption.querySelector("label");
      if (checkBox.checked) {
        switch (label.textContent) {
          case "Event":
            selectedTypes.push("event");
            break;
          case "Petition":
            selectedTypes.push("petition");
            break;
          case "Event & Petition":
            selectedTypes.push("event-petition");
            break;
        }
      }
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; //UTC format: 2025-03-06
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0]; //UTC format: 2025-03-06

    // store selected dates
    for (let dateOption of dateOptions) {
      const checkBox = dateOption.querySelector("input[type='checkbox']");
      const label = dateOption.querySelector("label");

      if (checkBox.checked) {
        switch (label.textContent) {
          case "Today":
            selectedDates.push(todayStr);
            break;
          case "Tomorrow":
            selectedDates.push(tomorrowStr);
            break;
          case "Weekend":
            if (!selectedDates.includes("weekend")) {
              selectedDates.push("weekend");
            }
            break;
        }
      }
    }

    // store seleted cities
    for (let cityOption of cityOptions) {
      const checkBox = cityOption.querySelector("input[type='checkbox']");
      const label = cityOption.querySelector("label");
      if (checkBox.checked) {
        try {
          selectedCities.push(label.textContent.toLowerCase());
        } catch {
          selectedCities.push(label.textContent);
        }
      }
    }

    // if no city is selected, it means all cities
    if (selectedCities.length === 0) {
      for (let cityOption of cityOptions) {
        try {
          selectedCities.push(cityOption.textContent.toLowerCase());
        } catch {
          selectedCities.push(cityOption.textContent);
        }
      }
    }

    // store selected time of day
    for (let timeOption of timeOptions) {
      const checkBox = timeOption.querySelector("input[type='checkbox']");
      const label = timeOption.querySelector("label");
      if (checkBox.checked) {
        selectedTimeOfDay.push(label.textContent);
      }
    }

    // store selected categories
    for (let categoryOption of categoryOptions) {
      const checkBox = categoryOption.querySelector("input[type='checkbox']");
      const label = categoryOption.querySelector("label");
      if (checkBox.checked) {
        switch (label.textContent) {
          case "Social Activism":
            selectedCategories.push("social");
            break;
          case "Environment":
            selectedCategories.push("environment");
            break;
          case "Politics":
            selectedCategories.push("politics");
            break;
          case "Community":
            selectedCategories.push("community");
            break;
          case "Education":
            selectedCategories.push("education");
            break;
          case "Human Rights":
            selectedCategories.push("human");
            break;
          case "Health":
            selectedCategories.push("health");
            break;
          case "Culture":
            selectedCategories.push("culture");
            break;
          case "Animal Rights":
            selectedCategories.push("animal");
            break;
          case "Justice":
            selectedCategories.push("justice");
            break;
          case "Others":
            selectedCategories.push("others");
            break;
        }
      }
    }

    // if no category is selected, it means all categories
    if (selectedCategories.length === 0) {
      selectedCategories.push(
        "social",
        "environment",
        "politics",
        "community",
        "education",
        "human",
        "health",
        "culture",
        "animal",
        "justice",
        "others"
      );
    }

    // pick up selected events
    for (let event of allEventsArray) {
      let selectedTp = false; // type - event/petition/event-petition
      let selectedDt = false; //date - today/tomorrow/weekend
      let selectedTm = false; //time of day - morning/afternoon/evening/night
      let selectedCat = false; //category
      try {
        event.type = event.type.toLowerCase(); // normalize type description
        event.city = event.city.toLowerCase(); // normalize city description

        // check type
        if (selectedTypes.length === 0) {
          selectedTp = true;
        }

        if (selectedTypes.includes(event.type)) {
          selectedTp = true;
        }

        if (!selectedTp) {
          continue;
        }

        // check dates
        const timestampStart = event["event_start_date_time"].seconds;
        const eventDate = new Date(timestampStart * 1000)
          .toISOString()
          .split("T"); // toString() => 2025-03-06T20:34:56.789Z .split("T") => 2025-03-06
        const eventDateLocal = new Date(timestampStart * 1000);
        const eventDayOfWeek = eventDateLocal.getDay(); //Sunday: 0, Monday: 1,...
        const isWeekend = eventDayOfWeek === 0 || eventDayOfWeek === 6;

        if (selectedDates.length === 0) {
          selectedDt = true; //if nothing is selected, it means all
        } else {
          for (let date of selectedDates) {
            if (date === "weekend" && isWeekend) {
              selectedDt = true;
              break;
            } else {
              if (date === eventDate) {
                selectedDt = true;
                break;
              }
            }
          }
        }

        if (!selectedDt) {
          continue;
        }

        // check city
        if (!selectedCities.includes(event.city)) {
          continue;
        }

        // check event_start_date_time
        if (
          !event["event_start_date_time"] ||
          !event["event_start_date_time"].seconds
        ) {
          continue;
        }

        // normalize category description
        for (let i = 0; i < event["event_categories"].length; i++) {
          event["event_categories"][i] =
            event["event_categories"][i].toLowerCase();
        }

        // check time of day
        const startDate = new Date(timestampStart);
        const startHour = startDate.getHours();

        const morningStr = "Morning (06:00 - 12:00)";
        const afternoonStr = "Afternoon (12:00 - 17:00)";
        const eveningStr = "Evening (17:00 - 20:00)";
        const nightStr = "Night (20:00 - 06:00)";

        if (6 <= startHour && startHour < 12) {
          if (selectedTimeOfDay.includes(morningStr)) {
            selectedTm = true;
          }
        } else if (12 <= startHour && startHour < 17) {
          if (selectedTimeOfDay.includes(afternoonStr)) {
            selectedTm = true;
          }
        } else if (17 <= startHour && startHour < 20) {
          if (selectedTimeOfDay.includes(eveningStr)) {
            selectedTm = true;
          }
        } else if (20 <= startHour || startHour <= 6) {
          if (selectedTimeOfDay.includes(nightStr)) {
            selectedTm = true;
          }
        }

        if (selectedTimeOfDay.length === 0) {
          selectedTm = true;
        }

        if (!selectedTm) {
          continue;
        }

        // check category
        for (let eventCat of event["event_categories"]) {
          if (selectedCategories.includes(eventCat)) {
            selectedCat = true;
            break;
          }
        }
        if (!selectedCat) {
          continue;
        }
      } catch (e) {
        // Nothing to do because all of event data are objects, and if it is error, that it not event data.
      }

      // check status
      if (event.status === "draft") {
        continue;
      }
      filteredEvents.push(event);
    }

    //Initialize: delete all cards
    const allCards = document.querySelectorAll(".event-cards");
    for (let card of allCards) {
      card.remove();
    }

    //Create filtered cards
    for (let eachEvent of filteredEvents) {
      createEventCard(eachEvent, eachEvent.id, "event-cards-all");
    }
    //Update makers in Map
    updateMapMarkers(filteredEvents);
  }, 0);
}

export function getFilteredEvents() {
  return filteredEvents;
}

function updateMapMarkers(filteredEvents) {
  console.log("Checking map instance inside updateMapMarkers...");
  console.log("map:", map);
  console.log(
    "map instanceof google.maps.Map:",
    map instanceof google.maps.Map
  );

  if (!map || !(map instanceof google.maps.Map)) {
    console.error("Error: Map instance is invalid inside updateMapMarkers.");
    return;
  }
  deleteAllEventMarkers();

  eventMarkers.forEach((marker) => marker.setMap(null));
  eventMarkers.length = [];

  for (let eachEvent of filteredEvents) {
    console.log("Creating new markers!");
    createEventMarker(eachEvent);
  }

  eventMarkers.forEach((eventMarker) => {
    eventMarker.setMap(map);
  });
}

//Delete all Event Markers in Map
function deleteAllEventMarkers() {
  for (let eventMarker of eventMarkers) {
    if (eventMarker instanceof google.maps.Marker) {
      eventMarker.setMap(null);
    } else {
      console.warn(
        "Event marker is not an instance of google.maps.Marker:",
        eventMarker
      );
    }
  }
}

//Create Event Marker in Map
function createEventMarker(event) {
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
}

// Sorting function
const sortMenuBtn = document.getElementById("sort-menu-btn");
const sortMenu = document.getElementById("sort-menu");
sortMenuBtn.addEventListener("click", showSortMenu);

function showSortMenu() {
  sortMenu.classList.toggle("active");
}

const sortOptions = document.querySelectorAll(".sort-options");
for (let sortOption of sortOptions) {
  sortOption.addEventListener("click", sortEvent);
}

function sortEvent(event) {
  generateAllEventArray();
  let sortedEvents = [];

  //Initialize
  const allCards = document.querySelectorAll(".event-cards");
  for (let card of allCards) {
    card.remove();
  }

  switch (event.currentTarget.id) {
    case "sort-latest":
      sortedEvents = [...allEventsArray].sort(
        (a, b) => b.created_at - a.created_at
      ); // larger comes first:new to old
      break;
    case "sort-trending":
      const tempAllEventsArray = [];

      for (let eachEvent of allEventsArray) {
        if (!eachEvent.participants) {
          continue;
        } else {
          tempAllEventsArray.push(eachEvent);
        }
      }

      sortedEvents = [...tempAllEventsArray].sort(
        (a, b) => b.participants.length - a.participants.length
      );
      break;
  }

  for (let eachEvent of sortedEvents) {
    createEventCard(eachEvent, eachEvent.id, "event-cards-all");
  }
}

export function applyFilters(events) {
  const selectedCategories = getSelectedCategories();
  const selectedCities = getSelectedCities();

  return events.filter((event) => {
    const categoryMatch = selectedCategories.length === 0 || event.event_categories.some(cat => selectedCategories.includes(cat));
    const cityMatch = selectedCities.length === 0 || selectedCities.includes(event.city.toLowerCase());
    return categoryMatch && cityMatch;
  });
}

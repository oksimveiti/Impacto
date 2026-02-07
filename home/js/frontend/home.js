import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { db, auth } from "../../../config/config.js";
import {
  createEventCard,
  formatTimestamp,
} from "../../../map-exploration/js/frontend/eventcard.js";
// const eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
const eventCache = new Map(); // Cache for event documents
const allEventsArray = await fetchAllEvents(); //fetchAllEvents returns array of all events AND renew the data in LocalStorage

console.log("allEventArray: ", allEventsArray);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User ID:", user.uid);
    console.log("calling setupCarousel...");
    if (window.location.href === "http://127.0.0.1:5504/home/html/home.html") {
      await setupCarousel(user);
    }
  } else {
    console.log("User is logged out.");
  }
});

async function getEventIdsByUserInterests(user) {
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

async function setupCarousel(user) {
  console.log("setupCarousel started...");
  const interestedEventIdsTemp = await getEventIdsByUserInterests(user);
  const interestedEventIds = [...new Set(interestedEventIdsTemp)];

  if (interestedEventIds.length > 0) {
    let counter = 0;
    const maxForYouCardNum = 4; // shows 4 events at most
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

            switch (eventData.type) {
              case "event":
                window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
                break;
              case "petition":
                window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/petition-detail.html?id=${eventId}`;
                break;
              case "event_petition":
                window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/event-petition-detail.html?id=${eventId}`;
                break;
            }
          });

          if (counter < maxForYouCardNum) {
            if (eventData.type !== "draft") {
              //for For you section
              createEventCard(eventData, eventId, "event-cards-for-you");
              counter++;

              //for Carousel on top
              generateCarouselSlides(eventData, eventId);
            }
          }
        } else {
          console.log(`Event document with ID ${eventId} not found.`);
        }
      } catch (error) {
        console.error(`Error getting title for event ID ${eventId}:`, error);
      }
    });
    await Promise.all(promises);
    setTimeout(() => {
      initializeCarousel();
      enableHorizontalDrag();
    }, 1000); // 1sec to wait for load images
  } else {
    console.log("No events to display.");
  }
}

async function fetchAllEvents() {
  // initialzie
  localStorage.removeItem("allEventsData");

  if (!db) {
    console.error("Firestore DB instance is missing!");
    return [];
  }

  const querySnapshot = await getDocs(collection(db, "events"));
  let events = [];

  // document means data record in Firestore. Documents are events in this application.
  for (const document of querySnapshot.docs) {
    const eventData = document.data();
    console.log(eventData);

    if (events.status === "draft") {
      continue;
    }

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
  localStorage.setItem("allEventsData", JSON.stringify(events));
  return events;
}

createCardsForTrend();
setTimeout(() => {
  initializeTrendingCarousel();
}, 500); // wait for loading images

function createCardsForTrend() {
  //sort allEventsArray
  let sortedbyParticipantsArray = [];
  for (const eachEvent of allEventsArray) {
    if (eachEvent.participants) {
      sortedbyParticipantsArray.push(eachEvent);
    }
  }

  sortedbyParticipantsArray.sort(
    (a, b) => b.participants.length - a.participants.length
  ); //Sort descendant order

  let i = 0;
  for (const eachEvent of sortedbyParticipantsArray) {
    if (i > 9) {
      break;
    }
    if (eachEvent.status === "draft") {
      continue;
    } else {
      i++;
      console.log(eachEvent);
      createEventSlidesForTrending(
        eachEvent,
        eachEvent.id,
        "trending-carousel-strip"
      );
    }
  }
}

function initializeTrendingCarousel() {
  const strip = document.getElementById("trending-carousel-strip");
  const allSlides = document.querySelectorAll(".trending-carousel-slides");
  // const slides = Array.from(allSlides).filter(slide => !slide.dataset.empty);
  const slides = Array.from(allSlides);
  if (slides.length === 0) {
    console.warn("No valid slides for trending carousel.");
    return;
  }

  const slideWidth = slides[0].offsetWidth;
  const slideMargin = 20; // margin-right
  const totalSlideWidth = slideWidth + slideMargin;

  const trendingPrevButton = document.getElementById("trending-prev");
  const trendingNextButton = document.getElementById("trending-next");

  let currentIndex = 0;
  let isTransitioning = false;

  // drag
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationID;
  let trendingHasMoved = false;

  function updateButtons() {
    trendingPrevButton.style.display = currentIndex === 0 ? "none" : "flex";
    trendingNextButton.style.display =
      currentIndex === slides.length - 1 ? "none" : "flex";
  }

  function setSliderPosition() {
    strip.style.transform = `translateX(${currentTranslate}px)`;
  }

  function animation() {
    setSliderPosition();
    if (isDragging) requestAnimationFrame(animation);
  }

  function getPositionX(event) {
    return event.type.includes("mouse")
      ? event.clientX
      : event.touches[0].clientX;
  }

  function touchStart(event) {
    isDragging = true;
    startX = getPositionX(event);
    animationID = requestAnimationFrame(animation);
    strip.style.transition = "none";
  }

  function touchMove(event) {
    if (!isDragging) return;
    const currentPosition = getPositionX(event);
    const moved = currentPosition - startX;
    currentTranslate = prevTranslate + moved;
    trendingHasMoved = true;

    // bounce
    const maxTranslate = 0;
    const minTranslate = -(totalSlideWidth * (slides.length - 1));

    if (currentTranslate > maxTranslate + 60) {
      currentTranslate = maxTranslate + 60;
    }
    if (currentTranslate < minTranslate - 60) {
      currentTranslate = minTranslate - 60;
    }
  }

  function touchEnd() {
    isDragging = false;
    cancelAnimationFrame(animationID);

    const movedBy = currentTranslate - prevTranslate;
    const threshold = 100;

    const isAtStart = currentIndex === 0;
    const isAtEnd = currentIndex === slides.length - 1;

    if (movedBy > threshold && !isAtStart) {
      currentIndex--;
    } else if (movedBy < -threshold && !isAtEnd) {
      currentIndex++;
    }

    moveToSlide(currentIndex);

    setTimeout(() => {
      trendingHasMoved = false;
    }, 0);
  }

  function moveToSlide(index) {
    if (isTransitioning) return;

    if (index < 0) index = 0;
    if (index > slides.length - 1) index = slides.length - 1;

    isTransitioning = true;
    currentIndex = index;

    currentTranslate = -totalSlideWidth * currentIndex;
    prevTranslate = currentTranslate;

    strip.style.transition = "transform 0.5s ease-in-out";
    setSliderPosition();

    setTimeout(() => {
      isTransitioning = false;
      updateButtons();
    }, 500);
  }

  // button
  trendingPrevButton.addEventListener("click", () => {
    if (currentIndex > 0) {
      moveToSlide(currentIndex - 1);
    }
  });

  trendingNextButton.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) {
      moveToSlide(currentIndex + 1);
    }
  });

  // mouse
  strip.addEventListener("mousedown", touchStart);
  strip.addEventListener("mousemove", touchMove);
  strip.addEventListener("mouseup", touchEnd);
  strip.addEventListener("mouseleave", () => {
    if (isDragging) touchEnd();
  });

  // swipe
  strip.addEventListener("touchstart", touchStart);
  strip.addEventListener("touchmove", touchMove);
  strip.addEventListener("touchend", touchEnd);

  slides.forEach((slide) => {
    slide.addEventListener("click", (e) => {
      const dragDistance = Math.abs(currentTranslate - prevTranslate);
      if (dragDistance > 5) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const eventHref = slide.dataset.href;
      if (eventHref) {
        console.log("[Trending click OK]", eventHref);
        window.location.href = eventHref;
      } else {
        console.warn("No href found on slide");
      }
    });
  });

  updateButtons();
}

function createEventSlidesForTrending(
  eachEvent,
  eventId,
  cardAreaId = "trending-carousel-strip"
) {
  let eventHref = "";

  switch (eachEvent.type) {
    case "event":
      eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
      break;
    case "petition":
      eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/petition-detail.html?id=${eventId}`;
      break;
    case "event_petition":
      eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/event-petition-detail.html?id=${eventId}`;
      break;
  }

  const eventCardSec = document.getElementById(cardAreaId);

  const slide = document.createElement("div");
  const image = document.createElement("img");
  const info = document.createElement("div");
  const categories = createCategoryDivs();
  const title = document.createElement("h3");
  const eventPeriod = document.createElement("span");
  const location = document.createElement("span");
  const participants = document.createElement("span");

  slide.classList.add("trending-carousel-slides");
  slide.dataset.href = eventHref;

  image.src = eachEvent.image_url;
  image.alt = eachEvent.description;
  image.classList.add("trending-image");
  info.classList.add("trending-meta-info");

  if (eachEvent.title.length > 24) {
    title.textContent = eachEvent.title.slice(0, 24) + "...";
  } else {
    title.textContent = eachEvent.title;
  }
  title.classList.add("trending-event-titles");
  eventPeriod.textContent = generateEventPeriod();
  eventPeriod.classList.add("trending-event-period");
  eachEvent.type === "petitioin"
    ? (location.textContent = "Petition Only")
    : (location.textContent = eachEvent.city);
  location.classList.add("trending-locations");
  participants.textContent = eachEvent.participants.length + " supporters";
  participants.classList.add("trending-participants");

  slide.append(image);
  slide.append(info);
  categories.forEach((categoryDiv) => {
    info.append(categoryDiv);
  });
  info.append(title);
  info.append(eventPeriod);
  info.append(location);
  info.append(participants);

  // slide.addEventListener("click", (event) => {
  //   if (trendingHasMoved) {
  //     event.preventDefault(); // cancel "click"
  //     return;
  //   }
  //   window.location.href = eventHref;
  // });

  slide.addEventListener("click", (e) => {
    const dragDistance = Math.abs(currentTranslate - prevTranslate);
    if (trendinghasMoved) {
      e.preventDefault();
      e.stopPropagation();
      trendinghasMoved = false;
      return;
    }

    //normal click
    console.log("[Trending click OK]");
    const eventHref = `/events/${eventData.id}`;
    window.location.href = eventHref;
  });

  eventCardSec.append(slide);

  function generateEventPeriod() {
    // const startDt = new Date(eachEvent.event_start_date_time.seconds * 1000);
    // const endDt = new Date(eachEvent.event_end_date_time.seconds * 1000);
    let startDt;
    let endDt;
    if (
      eachEvent.event_start_date_time &&
      eachEvent.event_start_date_time.seconds
    ) {
      startDt = new Date(eachEvent.event_start_date_time.seconds * 1000);
    } else {
      startDt = null;
    }

    if (
      eachEvent.event_end_date_time &&
      eachEvent.event_end_date_time.seconds
    ) {
      endDt = new Date(eachEvent.event_start_date_time.seconds * 1000);
    } else {
      endDt = null;
    }

    function formatDate(date) {
      if (startDt === null || endDt === null) {
        return null;
      }

      const day = date.getDate();
      const month = date
        .toLocaleString("en-GB", { month: "short" })
        .toUpperCase();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${hours}:${minutes}`;
    }

    return `${formatDate(startDt)} - ${formatDate(endDt)}`;
  }

  function createCategoryDivs() {
    const categoryArr = [];
    for (let i = 0; i < 1; i++) {
      const category = eachEvent.event_categories[i];
      const categoryDiv = document.createElement("div");
      categoryDiv.textContent = category;
      categoryDiv.classList.add("category-div");

      categoryArr.push(categoryDiv);
      if (eachEvent.event_categories.lenth === 1) {
        break;
      }
    }
    return categoryArr;
  }
}

//Generate contents for the carousel strip
function generateCarouselSlides(eachEvent, eventId) {
  const carouselStrip = document.getElementById("carousel-strip");

  const slide = document.createElement("div");
  const image = document.createElement("img");
  const info = document.createElement("div");
  const title = document.createElement("h3");
  const eventPeriod = document.createElement("span");
  const location = document.createElement("span");

  slide.classList.add("carousel-slides");
  image.src = eachEvent.image_url;
  image.alt = eachEvent.description;
  image.classList.add("carousel-image");
  info.classList.add("carousel-meta-info");
  if (eachEvent.title.length > 36) {
    title.textContent = eachEvent.title.slice(0, 36) + "...";
  } else {
    title.textContent = eachEvent.title;
  }
  title.classList.add("carousel-event-titles");
  eventPeriod.textContent = generateEventPeriod();
  eventPeriod.classList.add("carousel-event-period");
  eachEvent.type === "petitioin"
    ? (location.textContent = "Petition Only")
    : (location.textContent = eachEvent.city);
  location.classList.add("carousel-locations");

  slide.addEventListener("click", () => {
    switch (eachEvent.type) {
      case "event":
        window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
        break;
      case "petition":
        window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/petition-detail.html?id=${eventId}`;
        break;
      case "event_petition":
        window.location.href = `http://127.0.0.1:5504/create-event-Naomi/html/event-petition-detail.html?id=${eventId}`;
        break;
    }
  });

  info.append(title, eventPeriod, location);
  slide.append(image, info);

  carouselStrip.append(slide);

  function generateEventPeriod() {
    let startDt;
    let endDt;

    if (eachEvent.event_start_date_time.seconds) {
      startDt = new Date(eachEvent.event_start_date_time.seconds * 1000);
      endDt = new Date(eachEvent.event_end_date_time.seconds * 1000);
    } else if (eachEvent.petition_start_date_time.seconds) {
      startDt = new Date(eachEvent.petition_start_date_time.seconds * 1000);
      endDt = new Date(eachEvent.petition_end_date_time.seconds * 1000);
    } else {
      return null;
    }

    function formatDate(date) {
      const day = date.getDate();
      const month = date
        .toLocaleString("en-GB", { month: "short" })
        .toUpperCase();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${hours}:${minutes}`;
    }

    return `${formatDate(startDt)} - ${formatDate(endDt)}`;
  }
}

function initializeCarousel() {
  const strip = document.getElementById("carousel-strip");
  let slides = document.querySelectorAll(".carousel-slides");
  const indicatorsContainer = document.getElementById(
    "carousel-indicators-container"
  );

  if (slides.length === 0) {
    console.warn("No slides found for the carousel.");
    return;
  }

  // wait 0.3sec to load images
  setTimeout(() => {
    slides = document.querySelectorAll(".carousel-slides");
    const slideWidth = slides[0].offsetWidth;

    let currentIndex = 0;
    let isTransitioning = false;

    // Clone for smooth transition
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);

    firstClone.id = "first-clone";
    lastClone.id = "last-clone";

    strip.append(firstClone);
    strip.insertBefore(lastClone, slides[0]);

    slides = document.querySelectorAll(".carousel-slides");
    strip.style.transform = `translateX(0px)`;

    //Add indicators
    indicatorsContainer.innerHTML = ""; //initialize
    const indicators = [];

    for (let i = 0; i < slides.length - 2; i++) {
      //no need to add event listeners to clones
      const indicator = document.createElement("div");
      indicator.classList.add("indicator-dots");
      if (i === 0) {
        indicator.classList.add("active");
      }
      indicator.addEventListener("click", () => moveToSlide(i + 1, 0.1)); //Arrow function is required to pass variables
      indicatorsContainer.append(indicator);
      indicators.push(indicator);
    }

    function updateIndicators() {
      const indicators = document.querySelectorAll(".indicator-dots");
      for (let i = 0; i < indicators.length; i++) {
        indicators[i].classList.toggle("active", i === currentIndex - 1);
      }
    }

    //Mobile swipable
    let startX = 0;
    let isDragging = false;

    strip.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    strip.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      handleSwipe(endX - startX);
    });

    // Mouse events
    strip.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
    });

    strip.addEventListener("mouseup", (e) => {
      if (!isDragging) return;
      isDragging = false;
      const endX = e.clientX;
      handleSwipe(endX - startX);
    });

    strip.addEventListener("mouseleave", () => {
      isDragging = false; // Safety net if mouse leaves area
    });

    function handleSwipe(diff) {
      const threshold = 50;
      if (Math.abs(diff) > threshold) {
        if (diff < 0) {
          //left swipe
          moveToSlide(currentIndex + 1);
        } else {
          //right swipe
          moveToSlide(currentIndex - 1);
        }
      }
    }

    function moveToSlide(index, duration = 1.5) {
      if (isTransitioning) {
        return;
      }
      isTransitioning = true;

      currentIndex = index;
      strip.style.transition = `transform ${duration}s ease-in-out`;
      strip.style.transform = `translateX(${-slideWidth * currentIndex}px)`;

      setTimeout(() => {
        if (currentIndex === slides.length - 1) {
          // last clone
          strip.style.transition = "none";
          currentIndex = 1;
          strip.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        }
        if (currentIndex === 0) {
          // first clone
          strip.style.transition = "none";
          currentIndex = slides.length - 2;
          strip.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        }
        updateIndicators();
        isTransitioning = false;
      }, 500);
    }

    const carouselPrevButton = document.getElementById("carousel-prev");
    carouselPrevButton.addEventListener("click", () => {
      console.log("currentIndex: ", currentIndex);
      moveToSlide(currentIndex - 1, 0.1);
    });

    const carouselNextButton = document.getElementById("carousel-next");
    carouselNextButton.addEventListener("click", () => {
      moveToSlide(currentIndex + 1, 0.1);
    });

    console.log("Carousel movement set.");
    setInterval(() => {
      moveToSlide(currentIndex + 1);
    }, 5000);
  }, 500);
}

let recentCardCount = 0;
const maxRecentCardNum = 4;
const recentlyViewedEvents = JSON.parse(
  localStorage.getItem("recentlyViewed") || "[]"
);

const multiple = new Set(); //Set.has returns whether it already has the data
const uniqueRecentlyViewedEvents = recentlyViewedEvents.filter((eachEvent) => {
  //filter by conditions
  if (multiple.has(eachEvent.id)) {
    return false; // ommited by filter
  } else {
    multiple.add(eachEvent.id); // add to Set
    return true; // kept by filter
  }
});

for (const eachEvent of uniqueRecentlyViewedEvents) {
  if (recentCardCount < maxRecentCardNum) {
    createEventCard(eachEvent, eachEvent.id, "event-cards-recently-viewed");
    recentCardCount++;
  } else {
    break;
  }
}

enableHorizontalDrag();

function enableHorizontalDrag() {
  const scrollContainers = [
    document.querySelector("#for-you-section .card-area-div"),
    document.querySelector("#recently-viewed-section .card-area-div"),
  ].filter(Boolean);

  scrollContainers.forEach((container) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;
    let dragStartTime = 0;

    container.querySelectorAll("img").forEach((img) => {
      img.setAttribute("draggable", "false");
      img.addEventListener("dragstart", (e) => e.preventDefault());
    });

    function bindMouseUpHandler(container) {
      console.log("bindMouseUpHandler called with:", container);
      const mouseUpHandler = () => {
        isDown = false;
        setTimeout(() => {
          hasMoved = false;
          console.log(
            "[mouseup - delayed reset]",
            container.id,
            "hasMoved =",
            hasMoved
          );
        }, 100);
        container.classList.remove("dragging");
      };
      window.addEventListener("mouseup", mouseUpHandler, true);
      // container.addEventListener("mouseup", mouseUpHandler);
      // document.addEventListener("mouseup", mouseUpHandler);
      // window.addEventListener("mouseup", bindMouseUpHandler, true);

      // Cancel click after drag
      // container.querySelectorAll(".event-cards").forEach((card) => {
      //   card.addEventListener("click", (e) => {
      //     console.log("[click]", container.id, "hasMoved =", hasMoved);
      //     if (hasMoved) {
      //       console.log("[click canceled]", container.id);
      //       e.preventDefault();
      //       e.stopPropagation();
      //     }
      //   });
      // });
      container.querySelectorAll(".event-cards").forEach((card) => {
        card.addEventListener("click", (e) => {
          console.log("[click]", container.id, "hasMoved =", hasMoved);
          if (hasMoved) {
            console.log("[click canceled]", container.id);
            e.preventDefault();
            e.stopPropagation();
          }
        });
      });
    }

    container.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.clientX;
      scrollLeft = container.scrollLeft;
      hasMoved = false;
      dragStartTime = Date.now();
      console.log("[mousedown]", container.id, "hasMoved =", hasMoved);
      container.classList.add("dragging");
    });

    bindMouseUpHandler(container);

    // container.addEventListener("mouseup", () => {
    //   isDown = false;
    //   setTimeout(() => {
    //     hasMoved = false;
    //     console.log(
    //       "[mouseup - delayed reset]",
    //       container.id,
    //       "hasMoved =",
    //       hasMoved
    //     );
    //   }, 0);
    //   container.classList.remove("dragging");
    // });

    container.addEventListener("mouseleave", () => {
      isDown = false;
      setTimeout(() => {
        hasMoved = false;
        console.log(
          "[mouseleave - reset]",
          container.id,
          "hasMoved =",
          hasMoved
        );
      }, 0);
      container.classList.remove("dragging");
    });

    container.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const x = e.clientX;
      const walk = (x - startX) * 1.5;

      container.scrollLeft = scrollLeft - walk;
      hasMoved = true;
      console.log("[mousemove]", container.id, "hasMoved =", hasMoved);
    });

    let touchStartX = 0;
    let touchScrollLeft = 0;

    container.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchScrollLeft = container.scrollLeft;
      hasMoved = false;
    });

    container.addEventListener("touchmove", (e) => {
      const x = e.touches[0].clientX;
      const walk = x - touchStartX;
      container.scrollLeft = touchScrollLeft - walk;
      hasMoved = true;
    });

    // Cancel click after drag
    // container.querySelectorAll(".event-cards").forEach((card) => {
    //   card.addEventListener("click", (e) => {
    //     card = e.target.closest(".event-cards");
    //     if (!card) return; // if it's not card, skip below.
    //     const dragDuration = Date.now() - dragStartTime;
    //     console.log("[click]", container.id, "hasMoved =", hasMoved);
    //     if (hasMoved || dragDuration < 150) {
    //       console.log("[click canceled]", container.id);
    //       e.preventDefault();
    //       e.stopPropagation();
    //       hasMoved = false;
    //     }
    //   });
    // });
    container.addEventListener("click", (e) => {
      const card = e.target.closest(".event-cards");
      if (!card || !container.contains(card)) return;

      const dragDuration = Date.now() - dragStartTime;
      console.log("[click]", container.id, "hasMoved =", hasMoved);
      if (hasMoved || dragDuration < 150) {
        console.log("[click canceled]", container.id);
        e.preventDefault();
        e.stopPropagation();
      }
      hasMoved = false;
    });

  });
}

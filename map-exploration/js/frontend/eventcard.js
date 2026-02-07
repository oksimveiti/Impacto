export function createEventCard(eventData, eventId, cardAreaId = "event-card-section") {
  let eventHref = "";

  switch (eventData.type) {
    case "event":
      eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/event-detail.html?id=${eventId}`;
      break;
    case "petition":
      eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/petition-detail.html?id=${eventId}`;
      break;
    case "event_petition":
      eventHref = `http://127.0.0.1:5504/create-event-Naomi/html/event-petition-detail.html?id=${eventId}`
      break;
  }

  const eventCardSec = document.getElementById(cardAreaId);

  const card = document.createElement("div");
  const image = document.createElement("img");
  const info = document.createElement("div");
  const categories = createCategoryDivs();
  const title = document.createElement("h3");
  const eventPeriod = document.createElement("span");
  const location = document.createElement("span");
  const participants = document.createElement("span");

  card.classList.add("event-cards");
  image.src = eventData.image_url;
  image.alt = eventData.description;
  image.classList.add("event-image");
  info.classList.add("event-info");
  if (eventData.title.length > 36) {
    title.textContent = eventData.title.slice(0, 36) + "...";
  } else {
    title.textContent = eventData.title;
  }
  title.classList.add("event-titles");
  eventPeriod.textContent = generateEventPeriod();
  eventPeriod.classList.add("event-period");
  eventData.type === "petitioin" ? location.textContent = "Petition Only" : location.textContent = eventData.city;
  location.classList.add("event-locations");
  if (eventData.participants) {
    participants.textContent = eventData.participants.length + " supporters";
    participants.classList.add("event-participants");
  }

  card.append(image);
  card.append(info);
  categories.forEach((categoryDiv) => {
    info.append(categoryDiv);
  });
  info.append(title);
  info.append(eventPeriod);
  info.append(location);
  info.append(participants);

  card.addEventListener("click", () => {
    window.location.href = eventHref;
  })

  eventCardSec.append(card);

  function generateEventPeriod() {
    let startDt;
    let endDt
    try {
      startDt = new Date(eventData.event_start_date_time.seconds * 1000);
      endDt = new Date(eventData.event_end_date_time.seconds * 1000);
    } catch {
      return "";
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

  function createCategoryDivs() {
    const categoryArr = [];
    let numberOfCategories = eventData.event_categories.length < 3 ? eventData.event_categories.length : 2;


    for (let i = 0; i < numberOfCategories; i++) {
      const category = eventData.event_categories[i];
      const categoryDiv = document.createElement("div");
      categoryDiv.textContent = category;
      categoryDiv.classList.add("category-div");

      categoryArr.push(categoryDiv);
    }
    return categoryArr;
  }
}

export function formatTimestamp(seconds) {
  if (!seconds || !seconds.seconds) {
    console.warn("Invalid timestamp data:", seconds);
    return "Invalid Date";
  }
  const dateOriginal = new Date(seconds.seconds * 1000); //time stamp is second. not mil second
  const date = dateOriginal.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  const time = dateOriginal.toLocaleDateString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, //24hours
  });

  // return {date: date, time: time}
  return date + " " + time;
}

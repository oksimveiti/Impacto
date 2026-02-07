export function renewRecentlyViewed(eventId) {
  //get event info
  const allEventsArray = JSON.parse(
    localStorage.getItem("allEventsData") || "[]"
  );
  let thisEvent;
  console.log(eventId);
  console.log(allEventsArray);
  for (const eachEvent of allEventsArray) {
    if (eachEvent.id === eventId) {
      thisEvent = eachEvent;
      thisEvent.lastVisit = new Date();
      break;
    }
  }

  // define "recent"
  const recentDays = 30;
  const oldDays = new Date();
  oldDays.setDate(oldDays.getDate() - recentDays);

  // update Recently Viewed Events
  let recentlyViewedEvents = JSON.parse(
    localStorage.getItem("recentlyViewed") || "[]"
  );

  if (!thisEvent) {
    console.log("Event not found in allEventsData:", eventId);
    return;
  }

  //Add the current event to Recently Viewed Events
  recentlyViewedEvents.push(thisEvent);

  // Delete old events
  recentlyViewedEvents = recentlyViewedEvents.filter((event) => {
    const eachEventLastVisit = new Date(event.lastVisit);
    return eachEventLastVisit > oldDays;
  });

  //Sort New=> Old
  recentlyViewedEvents.sort(
    (a, b) => new Date(b.lastVisit) - new Date(a.lastVisit)
  );

  //update localStorage
  localStorage.removeItem("recentlyViewed");
  localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewedEvents));
}

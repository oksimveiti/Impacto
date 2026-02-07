import { firebaseConfig } from '../../../config/config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, Timestamp, updateDoc, arrayRemove, arrayUnion, deleteDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// the userdata; use userdata.uid as the user uid.
let userdata = JSON.parse(sessionStorage.getItem("userdata"));

//20250314-function blocks

// unpublish

async function moveEventToDraft(userUid, eventUid) {
  try {
    // 1. Remove eventUid from users/userUid/hosting_events
    const userDocRef = doc(db, "users", userUid);
    await updateDoc(userDocRef, {
      hosting_events: arrayRemove(eventUid)
    });

    // 2. Change status in events/eventUid/status
    const eventDocRef = doc(db, "events", eventUid);
    await updateDoc(eventDocRef, {
      status: "draft",
    });

    // 3. Add eventUid to users/userUid/drafts_events
    await updateDoc(userDocRef, {
      drafts_events: arrayUnion(eventUid)
    });

    console.log(`Event ${eventUid} moved to drafts for user ${userUid}.`);
  } catch (error) {
    console.error("Error moving event to drafts:", error);
  }
}

// delete drafts event

async function deleteDraftEvent(userUid, eventUid) {
  try {
    // 1. Remove eventUid from users/userUid/drafts_events
    const userDocRef = doc(db, "users", userUid);
    await updateDoc(userDocRef, {
      drafts_events: arrayRemove(eventUid)
    });

    // 2. remove the whole document in events/eventUid
    const eventDocRef = doc(db, "events", eventUid);
    await deleteDoc(eventDocRef);
    console.log(`Event ${eventUid} deletes`);
  } catch (error) {
    console.error("Error moving event to drafts:", error);
  }
}

// cancel attendance

async function cancelMyAttendance(userUid, eventUid) {
  try {
    // 1. Remove eventUid from users/userUid/attend_events
    const userDocRef = doc(db, "users", userUid);
    await updateDoc(userDocRef, {
      attend_events: arrayRemove(eventUid)
    });

    // 2. Remove userUid from events/eventUid/participants
    const eventDocRef = doc(db, "events", eventUid);
    await updateDoc(eventDocRef, {
      participants: arrayRemove(userUid)
    });


  } catch (error) {
    console.error("Error cancelling attendance:", error);
  }
}

//withdraw supporting

async function withdrawSupporting(userUid, eventUid) {
  try {
    // 1. Remove eventUid from users/userUid/supporting_events
    const userDocRef = doc(db, "users", userUid);
    await updateDoc(userDocRef, {
      supporting_events: arrayRemove(eventUid)
    });

    // 2. Remove userUid from events/eventUid/participants
    const eventDocRef = doc(db, "events", eventUid);
    await updateDoc(eventDocRef, {
      supporters: arrayRemove(userUid)
    });


  } catch (error) {
    console.error("Error withdrawing supporting:", error);
  }
}

//Unsave the bookmark;

async function unsaveBookmark(userUid, eventUid) {
  try {
    // 1. Remove eventUid from users/userUid/supporting_events
    const userDocRef = doc(db, "users", userUid);
    await updateDoc(userDocRef, {
      saved_events: arrayRemove(eventUid)
    });

  } catch (error) {
    console.error("Error unsave the event:", error);
  }
}

// Publish from unpublish

async function publishUnpublished(userUid, eventUid) {
  try {

    // 1. Remove eventUid from users/userUid/drafts_events
    const userDocRef = doc(db, "users", userUid);
    await updateDoc(userDocRef, {
      drafts_events: arrayRemove(eventUid)
    });

    // 2. Change status in events/eventUid/status
    const eventDocRef = doc(db, "events", eventUid);
    await updateDoc(eventDocRef, {
      status: "publish",
    });

    // 3. Add eventUid to users/userUid/hosting_events
    await updateDoc(userDocRef, {
      hosting_events: arrayUnion(eventUid)
    });

  } catch (error) {
    console.error("Error publish the event:", error);
  }
}

//I don't need the return of this function, just render again after call of this function;

//detect event-petition-or-both

let eventPetitionOrBoth = null;

async function getStatusFromDB(eventUid) {
  try {
    const eventDocRef = doc(db, "events", eventUid);
    const eventDocSnap = await getDoc(eventDocRef);

    if (eventDocSnap.exists()) {
      const eventData = eventDocSnap.data();
      const type = eventData.type;
      eventPetitionOrBoth = type;
    } else {
      console.log(`Document events/${eventUid} does not exist.`);
      return null; // Return a promise which can be resolved into null if the document doesn't exist
    }
  } catch (error) {
    console.error("getDoc is not working:", error);
  }
}

function eventStatusDetect() {
  console.log(eventPetitionOrBoth);
  switch (eventPetitionOrBoth) {
    case "event":
      return `../../create-event-Naomi/html/event-detail.html?id=`;
    // break; I don't need break because break is unreachable;

    case "petition":
      return `../../create-event-Naomi/html/petition-detail.html?id=`;
    // break;

    case "event_petition":
      return `../../create-event-Naomi/html/event-petition-detail.html?id=`;
    // break;

    default:
      console.log(`event type is wrong in firebase`);
  }
}

//detect event-petition-or-both end

// 20250314-function blocks end

// 20250310-try to create a ul inside a table created by fetching

let currentCategory = 'hosting'; //event state control;

let currentClickedEllipsisIndex = null;

const categoryToMenuMap = {
  hosting: 'ellipsis-ul-hosting',
  attending: 'ellipsis-ul-attending',
  supporting: 'ellipsis-ul-supporting',
  saved: 'ellipsis-ul-bookmark',
  drafts: 'ellipsis-ul-drafts'
};

function attachButtonListeners() {
  const buttonArray = document.querySelectorAll(".dots-menu-button");
  console.log("Buttons found:", buttonArray.length);//testing

  hideAllMenus();

  buttonArray.forEach((button, index) => {
    // Remove any existing listeners to prevent duplicates
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', (event) => {
      // console.log(`Button ${index} clicked`);//testing
      event.stopPropagation();
      console.log(`Button ${index} clicked for category: ${currentCategory}`);
      currentClickedEllipsisIndex = index; //20250314
      // const selectedTd = event.target.closest('td');
      // selectedTd.classList.toggle('backgroundColorRed');
      const menuClass = categoryToMenuMap[currentCategory];
      const menu = document.querySelector(`.${menuClass}`);

      if (!menu) {
        console.error(`Menu not found for class: ${menuClass}`);
        return;
      }

      hideAllMenus();

      if (menu.classList.contains('display-none')) {
        // Show the menu
        menu.classList.remove('display-none');

        // Position the menu
        const buttonRect = newButton.getBoundingClientRect();
        console.log(`Button position: left=${buttonRect.left}, top=${buttonRect.top}`);
        // for mobile and desktop view;
        const mobileQuery = window.matchMedia("(max-width: 767px)");
        const desktopQuery = window.matchMedia("(min-width: 768px)");
        // than customize for both screen view;
        if (desktopQuery.matches) {
          let marginTopNumber = 254 + (index * 251);
          console.log(marginTopNumber)
          menu.style.marginTop = `${marginTopNumber}px`;
        } else if (mobileQuery.matches) {
          let marginTopNumber = 220 + (index * 251);
          console.log(marginTopNumber)
          menu.style.marginTop = `${marginTopNumber}px`;
        }


      } else {
        // Hide the menu
        menu.classList.add('display-none');
      }
    });

  });

}

function hideAllMenus() {
  Object.values(categoryToMenuMap).forEach(menuClass => {
    const menu = document.querySelector(`.${menuClass}`);
    if (menu) {
      menu.classList.add('display-none');
      // console.log(`Hidden menu: ${menuClass}`);//testing
    } else {
      console.warn(`Menu not found during hideAllMenus: ${menuClass}`);
    }
  });
}

// click somewhere else will hide the menu
document.addEventListener('click', (event) => {
  const isMenuClick = event.target.closest('.ellipsis-ul');
  const isButtonClick = event.target.closest('.dots-menu-button');

  if (!isMenuClick && !isButtonClick) {
    hideAllMenus();
  }
});

// 20250310-end

// Convert timestamp to human-readable time;
function convertTimeStampCADDay(eventDataObj) {
  // define the format you want
  const daysOfWeekArray = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  // January = 0;
  const monthOfYearArray = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // console.log(eventDataObj, 'eventDataObj');
  const event_start_date_time = eventDataObj.event_start_date_time;
  // console.log(event_start_date_time, 'event_start_date_time'); //testing
  const event_end_date_time = eventDataObj.event_end_date_time;
  // console.log(event_end_date_time, 'event_end_date_time');
  const petition_start_date_time = eventDataObj.petition_start_date_time;
  const petition_end_date_time = eventDataObj.petition_end_date_time;

  if (event_start_date_time instanceof Timestamp && event_end_date_time instanceof Timestamp) { // Make sure the field is a timestamp.
    const startDate = event_start_date_time.toDate(); // Convert to JavaScript Date
    // This date is already Vancouver Time Zone = PST = PT = UT-8;
    // console.log(startDate, 'date');
    // date format: 
    // Sat Mar 29 2025 13:00:00 GMT-0700 (Pacific Daylight Time)
    // Time zone will automatically follow your location;
    const endDate = event_end_date_time.toDate();

    // start time
    const startDay = String(startDate.getDate()).padStart(2, '0');
    // console.log(startDay, 'startDay');
    const startWeekIndex = startDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startWeekName = daysOfWeekArray[startWeekIndex];
    // month
    const startMonthIndex = startDate.getMonth();
    const startMonth = monthOfYearArray[startMonthIndex];
    const startHour = String(startDate.getHours()).padStart(2, '0');

    // end time;
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const convertArray = [startDay, startWeekName, startMonth, startHour, endHour];
    return convertArray; //it works

  } else if (petition_start_date_time instanceof Timestamp && petition_end_date_time instanceof Timestamp) {
    const startDate = petition_start_date_time.toDate(); // Convert to JavaScript Date
    // This date is already Vancouver Time Zone = PST = PT = UT-8;
    // console.log(startDate, 'date');
    // date format: 
    // Sat Mar 29 2025 13:00:00 GMT-0700 (Pacific Daylight Time)
    // Time zone will automatically follow your location;
    const endDate = petition_end_date_time.toDate();

    // start time
    const startDay = String(startDate.getDate()).padStart(2, '0');
    // console.log(startDay, 'startDay');
    const startWeekIndex = startDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const startWeekName = daysOfWeekArray[startWeekIndex];
    // month
    const startMonthIndex = startDate.getMonth();
    const startMonth = monthOfYearArray[startMonthIndex];
    const startHour = String(startDate.getHours()).padStart(2, '0');

    // end time;
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const convertArray = [startDay, startWeekName, startMonth, startHour, endHour];
    return convertArray; //it works

  } else {
    console.log("event/petition_start_date_time or event/petition_end_date_time is not a Timestamp. It's probably a null");
  }
}

// get event Promise
// async always returns a promise
async function getEventObj(eventUid) {
  const eventDocRef = doc(db, "events", eventUid);
  try {
    const eventDataPromise = await getDoc(eventDocRef);
    // Return promise first deal with it later;
    return eventDataPromise;
  } catch (error) {
    console.error(error);
  }
}

// function section
// Notice that async function can only return a promise, but there is no need for return in this case so it's fine.
async function hostingRender() {
  currentCategory = 'hosting';
  tbody.innerHTML = '';
  // database
  if (hostingEventsArray.length == 0) {
    let h1 = document.createElement('h1');
    h1.textContent = 'No Hosting Events yet'; //write what designers tell you to write;
    tbody.append(h1);
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "250px";
  } else {
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "0px";
    let allEventHtml = '';
    // console.log(hostingEventsArray, 5);
    for (const eventUid of hostingEventsArray) {
      const eventDataPromise = await getEventObj(eventUid);
      const eventDataObj = eventDataPromise.data();
      // console.log(eventDataObj, 'eventDataObj')
      const dayArray = convertTimeStampCADDay(eventDataObj);
      allEventHtml += createEventTable(eventDataObj, dayArray);
    }
    // really stack the table rows.
    tbody.innerHTML = allEventHtml;
    attachButtonListeners();
  }
  // css related - consider make it to the top of code block
  // blue background color
  document.querySelector('.event-categories-selected').classList.remove('event-categories-selected');
  document.querySelector('.event-categories-not-selected').classList.remove('event-categories-not-selected');
  document.getElementById('ul1Category').classList.add('event-categories-selected');
  document.getElementById('ul2Category').classList.add('event-categories-not-selected');
  // text color
  document.querySelector('.selected-li').classList.remove('selected-li');
  document.getElementById('hosting').classList.add('selected-li');

}

async function attendingRender() {
  currentCategory = 'attending';
  tbody.innerHTML = '';
  if (attendEventsArray.length == 0) {
    let h1 = document.createElement('h1');
    h1.textContent = 'No attend Events yet'; //write what designers tell you to write;
    tbody.append(h1);
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "250px";
  } else {
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "0px";
    let allEventHtml = '';
    // console.log(attendEventsArray, 5);
    for (const eventUid of attendEventsArray) {
      const eventDataPromise = await getEventObj(eventUid);
      const eventDataObj = eventDataPromise.data();
      // console.log(eventDataObj, 'eventDataObj')
      const dayArray = convertTimeStampCADDay(eventDataObj);
      allEventHtml += createEventTable(eventDataObj, dayArray);
    }
    tbody.innerHTML = allEventHtml;
    attachButtonListeners();
  }
  // css related
  // blue background color
  document.querySelector('.event-categories-selected').classList.remove('event-categories-selected');
  document.querySelector('.event-categories-not-selected').classList.remove('event-categories-not-selected');
  document.getElementById('ul2Category').classList.add('event-categories-selected');
  document.getElementById('ul1Category').classList.add('event-categories-not-selected');
  // text color
  document.querySelector('.selected-li').classList.remove('selected-li');
  document.getElementById('attending').classList.add('selected-li');
}

async function supportingRender() {
  currentCategory = 'supporting';
  tbody.innerHTML = '';
  if (supportingEventsArray.length == 0) {
    let h1 = document.createElement('h1');
    h1.textContent = 'No supporting Events yet'; //write what designers tell you to write;
    tbody.append(h1);
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "250px";
  } else {
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "0px";
    let allEventHtml = '';
    for (const eventUid of supportingEventsArray) {
      const eventDataPromise = await getEventObj(eventUid);
      const eventDataObj = eventDataPromise.data();
      // console.log(eventDataObj, 'eventDataObj')
      const dayArray = convertTimeStampCADDay(eventDataObj);
      allEventHtml += createEventTable(eventDataObj, dayArray);
    }
    tbody.innerHTML = allEventHtml;
    attachButtonListeners();
  }
  // css related
  // blue background color
  document.querySelector('.event-categories-selected').classList.remove('event-categories-selected');
  document.querySelector('.event-categories-not-selected').classList.remove('event-categories-not-selected');
  document.getElementById('ul2Category').classList.add('event-categories-selected');
  document.getElementById('ul1Category').classList.add('event-categories-not-selected');
  // text color
  document.querySelector('.selected-li').classList.remove('selected-li');
  document.getElementById('supporting').classList.add('selected-li');
}

async function savedRender() {
  currentCategory = 'saved';
  tbody.innerHTML = '';
  if (savedEventsArray.length == 0) {
    let h1 = document.createElement('h1');
    h1.textContent = 'No saved Events yet'; //write what designers tell you to write;
    tbody.append(h1);
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "250px";
  } else {
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "0px";
    let allEventHtml = '';
    for (const eventUid of savedEventsArray) {
      const eventDataPromise = await getEventObj(eventUid);
      const eventDataObj = eventDataPromise.data();
      // console.log(eventDataObj, 'eventDataObj')
      const dayArray = convertTimeStampCADDay(eventDataObj);
      allEventHtml += createEventTable(eventDataObj, dayArray);
    }
    tbody.innerHTML = allEventHtml;
    attachButtonListeners();
  }
  // css related
  // blue background color
  document.querySelector('.event-categories-selected').classList.remove('event-categories-selected');
  document.querySelector('.event-categories-not-selected').classList.remove('event-categories-not-selected');
  document.getElementById('ul2Category').classList.add('event-categories-selected');
  document.getElementById('ul1Category').classList.add('event-categories-not-selected');
  // text color
  document.querySelector('.selected-li').classList.remove('selected-li');
  document.getElementById('saved').classList.add('selected-li');
}

async function draftsRender() {
  currentCategory = 'drafts';
  tbody.innerHTML = '';
  if (draftsEventsArray.length == 0) {
    let h1 = document.createElement('h1');
    h1.textContent = 'No drafts Events yet'; //write what designers tell you to write;
    tbody.append(h1);
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "250px";
  } else {
    const footerDesktop = document.querySelector('.footer-desktop');
    footerDesktop.style.marginTop = "0px";
    let allEventHtml = '';
    for (const eventUid of draftsEventsArray) {
      const eventDataPromise = await getEventObj(eventUid);
      const eventDataObj = eventDataPromise.data();
      // console.log(eventDataObj, 'eventDataObj')
      const dayArray = convertTimeStampCADDay(eventDataObj);
      allEventHtml += createEventTable(eventDataObj, dayArray);
    }
    tbody.innerHTML = allEventHtml;
    attachButtonListeners();
  }
  // css related
  // blue background color
  document.querySelector('.event-categories-selected').classList.remove('event-categories-selected');
  document.querySelector('.event-categories-not-selected').classList.remove('event-categories-not-selected');
  document.getElementById('ul1Category').classList.add('event-categories-selected');
  document.getElementById('ul2Category').classList.add('event-categories-not-selected');
  // text color
  document.querySelector('.selected-li').classList.remove('selected-li');
  document.getElementById('drafts').classList.add('selected-li');
}


// timestamp need extra process before usage and be stored inside dayArray and pass here
function createEventTable(eventDataObj, dayArray) {

  let innerHtmlString;
  // 20250224_Convert the time stamp into human readable time function;
  // 20250224_Deal with the <i class="fa-solid fa-ellipsis-vertical"></i>
  // const convertArray = [startDay, startWeekName, startMonth, startHour, endHour];
  // console.log(eventDataObj.supporters, 'eventDataObj.supporters')
  // console.log(eventDataObj.supporters.length, 'eventDataObj.supporters.length')

  // better replace the html string to createElement;
  innerHtmlString = `
    <tr>
    <td class='event-column desktop-only'><p>${dayArray[1]}</p><p>${dayArray[0]}</p></td>
    <td class='image-column td-image-column'><div class="table-img-container"><img src="${eventDataObj.image_url}"></div></td>
    <td class="description-column"><h3>${eventDataObj.title}</h3><br><p>${dayArray[0]} ${dayArray[2]} at ${dayArray[3]}:00 - ${dayArray[4]}:00</p><br><p>${eventDataObj.city}</p></td>
    <td class='support-column desktop-only'><p>${eventDataObj.supporters.length} / ${eventDataObj.max_supporters}</p></td>
    <td class='participant-column desktop-only'><p>${eventDataObj.participants.length} / ${eventDataObj.max_participants}</p></td>
    <td class='status-column desktop-only'><p>${eventDataObj.status}<p></td>
    <td class='ellipsis-column'><button class = "dots-menu-button"><i class="fa-solid fa-ellipsis-vertical"></i></button>
    </td>
    </tr>
    `
  return innerHtmlString;
}

// Duplicate the events to the following blank event arrays;
let hostingEventsArray = [];
let attendEventsArray = [];
let supportingEventsArray = [];
let savedEventsArray = [];
let draftsEventsArray = [];

const tbody = document.querySelector('table tbody');

// JS start

document.addEventListener("DOMContentLoaded", () => {

  // show the userName;
  const userName = document.getElementById('userName');
  userName.textContent = userdata.username;

  // Always keep the nodes inside the "DOMContentLoaded", it's a better practice;
  const hostingNumber = document.getElementById('hostingNumber');
  const attendingNumber = document.getElementById('attendingNumber');
  const supportingNumber = document.getElementById('supportingNumber');
  const savedNumber = document.getElementById('savedNumber');
  const draftsNumber = document.getElementById('draftsNumber');

  const hosting = document.getElementById('hosting');
  const attending = document.getElementById('attending');
  const supporting = document.getElementById('supporting');
  const saved = document.getElementById('saved');
  const drafts = document.getElementById('drafts');

  // Get the number from firebase
  onAuthStateChanged(auth, async (user) => {
    // you must sign in first to test this function;
    if (user) {
      // console.log(user, 'user');
      const userDocRef = doc(db, "users", user.uid);
      // console.log(userDocRef, 'userDocRef');

      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {  //the exists() is a method of DocumentSnapshot object. Not a JS function but specific to firebase.
          // This is the only reliable way to check if an document really exists at certain reference;
          // !getDoc() can succeed even if the document doesn't exist!
          const userData = userDocSnap.data(); // Turn DocumentSnapshot object into an object containing the document's fields and their values;

          if (userData.hosting_events == undefined) {
            hostingNumber.textContent = 0;
          } else {
            const hostingEventsArrayDB = userData.hosting_events;
            hostingEventsArray = structuredClone(hostingEventsArrayDB);
            hostingNumber.textContent = hostingEventsArray.length;
          }

          if (userData.attend_events == undefined) {
            attendingNumber.textContent = 0;
          } else {
            const attendEventsArrayDB = userData.attend_events;
            attendEventsArray = structuredClone(attendEventsArrayDB);
            attendingNumber.textContent = attendEventsArray.length;
          }

          if (userData.supporting_events == undefined) {
            supportingNumber.textContent = 0;
          } else {
            const supportingEventsArrayDB = userData.supporting_events;
            supportingEventsArray = structuredClone(supportingEventsArrayDB);
            supportingNumber.textContent = supportingEventsArray.length;
          }

          if (userData.saved_events == undefined) {
            savedNumber.textContent = 0;
          } else {
            const savedEventsArrayDB = userData.saved_events;
            savedEventsArray = structuredClone(savedEventsArrayDB);
            savedNumber.textContent = savedEventsArray.length;
          }


          if (userData.drafts_events == undefined) {
            draftsNumber.textContent = 0;
          } else {
            const draftsEventsArrayDB = userData.drafts_events;
            draftsEventsArray = structuredClone(draftsEventsArrayDB);
            draftsNumber.textContent = draftsEventsArray.length;
          }


        } else {
          console.log('User Document does not exist');
        }
        // loading the event-related table;
        hostingRender();
        hosting.addEventListener('click', hostingRender);
        attending.addEventListener('click', attendingRender);
        supporting.addEventListener('click', supportingRender);
        saved.addEventListener('click', savedRender);
        drafts.addEventListener('click', draftsRender);

        // 20250313 unpublish


      } catch (error) {
        console.error("Error fetching user data:", error);
      }

    } else {
      console.log('no user log-in');
      // Maybe guide to log-in page?
    }
  });

  // 20250310 hosting hidden-menu;
  const hostingMenuView = document.getElementById('hostingMenuView');
  hostingMenuView.addEventListener('click', async (event) => {
    await getStatusFromDB(hostingEventsArray[currentClickedEllipsisIndex]);
    let statusURL = eventStatusDetect();
    // console.log(statusURL + `${hostingEventsArray[currentClickedEllipsisIndex]}`)
    window.location.href = statusURL + `${hostingEventsArray[currentClickedEllipsisIndex]}`;
  });
  const hostingMenuEdit = document.getElementById('hostingMenuEdit');
  hostingMenuEdit.addEventListener('click', (event) => {
    let theIndex = hostingEventsArray[currentClickedEllipsisIndex];
    sessionStorage.setItem('EditeventId', theIndex);
    window.location.href = `./event-edit.html?id=${hostingEventsArray[currentClickedEllipsisIndex]}`;
  });
  const hostingMenuCopyLink = document.getElementById('hostingMenuCopyLink');
  hostingMenuCopyLink.addEventListener('click', async (event) => {
    // same as view button
    await getStatusFromDB(hostingEventsArray[currentClickedEllipsisIndex]);
    let statusURL = eventStatusDetect();
    // copy the url to clipboard
    navigator.clipboard.writeText(statusURL + `${hostingEventsArray[currentClickedEllipsisIndex]}`);
    alert('Link copied to clipboard');
  })

  const hostingUnpublish = document.getElementById('hostingUnpublish');
  hostingUnpublish.addEventListener('click', (event) => {
    // console.log(currentClickedEllipsisIndex);//success
    // console.log(hostingEventsArray);//success
    let doubleCheck = confirm("Are you sure you want to unpublish this event?");
    const menu = document.querySelector('.ellipsis-ul-hosting');
    if (doubleCheck) {
      //20250314
      moveEventToDraft(userdata.uid, hostingEventsArray[currentClickedEllipsisIndex]);
      // need to refresh the page manually;
      // why location.reload(); does not work?
    }
    menu.classList.add('display-none');
  })

  // end of hosting hidden-menu;

  // 20250315 drafts event hidden-menu;

  const draftsMenuView = document.getElementById('draftsMenuView');
  draftsMenuView.addEventListener('click', (event) => {
    window.location.href = `../../create-event-Naomi/html/event-detail.html?id=${draftsEventsArray[currentClickedEllipsisIndex]}`;
  });

  const draftsMenuPublish = document.getElementById('draftsMenuPublish');
  draftsMenuPublish.addEventListener('click', (event) => {
    let doubleCheck = confirm("Ready for publish of this event?");
    const menu = document.querySelector('.ellipsis-ul-drafts');
    if (doubleCheck) {
      //20250314
      publishUnpublished(userdata.uid, draftsEventsArray[currentClickedEllipsisIndex]);
      // need to refresh the page manually;
      // why location.reload(); does not work?
    }
    menu.classList.add('display-none');
  })

  const draftsMenuDelete = document.getElementById('draftsMenuDelete');
  draftsMenuDelete.addEventListener('click', (event) => {
    // 20250311
    // cancelMyAttendance
    let doubleCheck = confirm("Are you sure you want to delete this draft? This can't be undone.");
    const menu = document.querySelector('.ellipsis-ul-drafts');
    if (doubleCheck) {
      //20250314
      deleteDraftEvent(userdata.uid, draftsEventsArray[currentClickedEllipsisIndex]);
      // need to refresh the page manually;
      // why location.reload(); does not work?
    }
    menu.classList.add('display-none');
  })

  // 20250315 drafts event hidden-menu end;

  // 20250310 attending hidden-menu;

  const attendingMenuView = document.getElementById('attendingMenuView');
  attendingMenuView.addEventListener('click', async (event) => {
    await getStatusFromDB(attendEventsArray[currentClickedEllipsisIndex]);
    let statusURL = eventStatusDetect();
    window.location.href = statusURL + `${attendEventsArray[currentClickedEllipsisIndex]}`;
  });
  const attendingMenuCopyLink = document.getElementById('attendingMenuCopyLink');
  attendingMenuCopyLink.addEventListener('click', async (event) => {
    await getStatusFromDB(attendEventsArray[currentClickedEllipsisIndex]);
    let statusURL = eventStatusDetect();
    navigator.clipboard.writeText(statusURL + `${hostingEventsArray[currentClickedEllipsisIndex]}`);
    alert('Link copied to clipboard');
  });
  const attendingMenuAddToCalendar = document.getElementById('attendingMenuAddToCalendar');
  attendingMenuAddToCalendar.addEventListener('click', (event) => {
    // future feature
    alert('Added to your calendar');
  })
  const attendingMenuCancelMyAttendance = document.getElementById('attendingMenuCancelMyAttendance');
  attendingMenuCancelMyAttendance.addEventListener('click', async (event) => {
    // 20250311
    // cancelMyAttendance
    let doubleCheck = confirm("Are you sure you want to stop attending this event? This can't be undone.");
    const menu = document.querySelector('.ellipsis-ul-attending');
    if (doubleCheck) {
      //20250314
      await cancelMyAttendance(userdata.uid, attendEventsArray[currentClickedEllipsisIndex]);
      // need to refresh the page manually;
      // why location.reload(); does not work?
    }
    menu.classList.add('display-none');
  })

  // end of attending hidden-menu;

  // 20250315 supporting event hidden menu

  const supportingMenuView = document.getElementById('supportingMenuView');
  supportingMenuView.addEventListener('click', async (event) => {
    await getStatusFromDB(supportingEventsArray[currentClickedEllipsisIndex]);
    let statusURL = eventStatusDetect();
    // console.log(statusURL);
    window.location.href = statusURL + `${supportingEventsArray[currentClickedEllipsisIndex]}`;
  });

  const supportingMenuWithdraw = document.getElementById('supportingMenuWithdraw');
  supportingMenuWithdraw.addEventListener('click', async () => {
    await withdrawSupporting(userdata.uid, supportingEventsArray[currentClickedEllipsisIndex]);
  })

  // 20250315 supporting event hidden menu end

  // 20250315 Bookmark event hidden menu;

  const bookmarkMenuView = document.getElementById('bookmarkMenuView');
  bookmarkMenuView.addEventListener('click', async (event) => {
    await getStatusFromDB(savedEventsArray[currentClickedEllipsisIndex]);
    let statusURL = eventStatusDetect();
    window.location.href = statusURL + `${savedEventsArray[currentClickedEllipsisIndex]}`;

  });

  const bookmarkMenuUnsave = document.getElementById('bookmarkMenuUnsave');
  bookmarkMenuUnsave.addEventListener('click', async () => {
    // withdrawSupporting(userdata.uid, savedEventsArray[currentClickedEllipsisIndex]);
    let doubleCheck = confirm("Are you sure you want to remove bookmark on this event?");
    const menu = document.querySelector('.ellipsis-ul-bookmark');
    if (doubleCheck) {
      //20250314
      await unsaveBookmark(userdata.uid, savedEventsArray[currentClickedEllipsisIndex]);
      // need to refresh the page manually;
      // why location.reload(); does not work?
    }
    menu.classList.add('display-none');
  })

  // 20250315 Bookmark event hidden menu end
  // Log out
  // const logOutBtn = document.getElementById('logOutBtn');
  // logOutBtn.addEventListener('click', async function (event) {

  //   event.preventDefault();

  //   try {
  //     const signOutPromise = signOut(auth);
  //     alert("Sign Out Successful");

  //     window.location.href = '../../index.html';
  //   } catch (error) {
  //     console.log(error);
  //     alert(error.message);
  //   };

  // })


})

//footer js
const createBtn1 = document.getElementById(createBtn1);
const createBtn2 = document.getElementById(createBtn2);
const modal = document.getElementById("eventTypeModal");

document.addEventListener("DOMContentLoaded", function () {
  createBtn1.addEventListener("click", function (e) {
    e.preventDefault();
    modal.classList.add("active");
  });

  createBtn2.addEventListener("click", function (e) {
    e.preventDefault();
    alert("yes");
    modal.classList.add("active");
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
  });
});
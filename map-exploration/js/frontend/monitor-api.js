import {
  stopRealtimeUpdates,
  startRealtimeUpdates,
  getMapInstance,
  map,
} from "./map-api.js";

const apiMonitor = document.getElementById("api-monitor");
const warning = document.createElement("p");
const mapApiCallCountElem = document.createElement("p");
const firestoreCallCountElem = document.createElement("p");
const status = document.createElement("p");
const stopButton = document.createElement("button");
const restartButton = document.createElement("button");

warning.textContent = "Be Careful!";
mapApiCallCountElem.textContent = "Google Maps API Call in this session: 0";
firestoreCallCountElem.textContent = "Firestore Call in this session: 0";
status.innerHTML = "Real-time updates: <span>ON</span>";

stopButton.textContent = "Stop Realtime Update";
restartButton.textContent = "Restart Realtime Update";

export function trackApiUsage() {
  const apiCallCount =
    parseInt(sessionStorage.getItem("apiCallCount") || "0") + 1;
  sessionStorage.setItem("apiCallCount", apiCallCount);

  console.log("Google Maps API Call Count:", apiCallCount);
  mapApiCallCountElem.textContent = `Google Maps API Call in this session: ${apiCallCount}`;
}

export function trackFirestoreUsage() {
  const firestoreCallCount =
    parseInt(sessionStorage.getItem("firestoreCallCount") || "0") + 1;
  sessionStorage.setItem("firestoreCallCount", firestoreCallCount);

  console.log("Firestore Call Count:", firestoreCallCount);
  firestoreCallCountElem.textContent = `Firestore Call in this session: ${firestoreCallCount}`;
}

stopButton.addEventListener("click", () => {
  stopRealtimeUpdates();
  status.innerHTML = "Real-time updates: <span>OFF</span>";
  console.log("Real-time updates have been stopped.");
});

// restartButton.addEventListener("click", () => {
//   const map = getMapInstance();
//   if (mapContainer && google.maps) {
//     if (map) {
//       startUserPositionUpdates(map);
//       status.innerHTML = "Real-time updates: <span>ON</span>";
//       console.log("Real-time updates have been restarted.");
//     } else {
//       console.error("Map instance not found. Cannot restart updates.");
//     }
//   } else {
//     console.error("Map container not found. Cannot restart updates.");
//   }
// });


// apiMonitor.style.top = "0";
// apiMonitor.style.left = "0";
// apiMonitor.style.width = "100%";
// apiMonitor.style.backgroundColor = "yellow";
// apiMonitor.style.color = "red";
// apiMonitor.style.padding = "10px";
// apiMonitor.style.fontSize = "32px";
// apiMonitor.style.textAlign = "center";
// apiMonitor.style.zIndex = "1000";
// apiMonitor.style.fontWeight = "bold";
// apiMonitor.style.display = "flex";
// apiMonitor.style.flexFlow = "column nowrap";
// apiMonitor.style.justifyContent = "center";
// apiMonitor.style.alignItems = "center";

// status.style.color = "black";

// stopButton.style.margin = "10px";
// stopButton.style.padding = "10px 20px";
// stopButton.style.fontSize = "16px";
// stopButton.style.cursor = "pointer";

// restartButton.style.margin = "10px";
// restartButton.style.padding = "10px 20px";
// restartButton.style.fontSize = "16px";
// restartButton.style.cursor = "pointer";

// apiMonitor.append(warning);
// apiMonitor.append(mapApiCallCountElem);
// apiMonitor.append(firestoreCallCountElem);
// apiMonitor.append(status);
// apiMonitor.append(stopButton);
// apiMonitor.append(restartButton);

// trackApiUsage();
// trackFirestoreUsage();

// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
// import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js";
// import { firebaseConfig} from "../../../config/config.js";
// // import { app, db, messaging} from "./firebase.js"; *Couldn't use this 
// import { vapidKey } from "./vapid.config.js";

// // const firebaseConfig = {
// //   apiKey: "",
// //   authDomain: "",
// //   projectId: "",
// //   storageBucket: "",
// //   messagingSenderId: "",
// //   appId: ""
// // };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);

// let serviceWorkerRegistered = false;

// // Register Service Worker, Obtain FCM token
// async function registerServiceWorkerAndGetToken() {
//   if ('serviceWorker' in navigator && !serviceWorkerRegistered) {
//     try {
//       const registration = await navigator.serviceWorker.register('/service-worker.js');
//       console.log('Service Worker registered with scope:', registration.scope);
//       serviceWorkerRegistered = true;

//       const token = await getToken(messaging, {
//         vapidKey: vapidKey,
//         serviceWorkerRegistration: registration
//       });

//       if (token) {
//         console.log('FCM Token is:', token);
//       } else {
//         console.log('Failed to obtain FCM Token');
//       }
//     } catch (error) {
//       console.error('Frailed to register sw or obtain token:', error);
//     }
//   } else {
//     console.log("This browser doesn't support SW");
//   }
// }

// // Recieve notification on foreground
// onMessage(messaging, (payload) => {
//   console.log('Recieve notif on foreground:', payload);
//   alert(`New Notif: ${payload.notification.title}\n${payload.notification.body}`);
// });

// registerServiceWorkerAndGetToken();
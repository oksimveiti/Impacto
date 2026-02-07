async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      console.log(`Service Worker registered successfully`, reg);
    } catch (error) {
      console.log(`Service Worker registration Error :${error}`);
    }
  }
}

window.addEventListener("load", registerSW);

// import { vapidKey } from "../../../push-notif/js/frontend/vapid.config.js";
// let serviceWorkerRegistered = false;


// document.addEventListener('DOMContentLoaded', () => {
//   // if ('serviceWorker' in navigator) {
//   //   navigator.serviceWorker.register('/service-worker.js')
//   //     .then((registration) => {
//   //       console.log('Service Worker registered: ', registration);
//   //     })
//   //     .catch((error) => {
//   //       console.log('Service Worker registration failed: ', error);
//   //     });
//   // }
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/service-worker.js', { type: 'module' })
//       .then(registration => {
//         console.log('Service Worker registered:', registration);
//       })
//       .catch(error => {
//         console.error('Service Worker registration failed:', error);
//       });
//   }
  
// });

// async function registerServiceWorkerAndGetToken() {
//   if ('serviceWorker' in navigator && !serviceWorkerRegistered) {
//     try {
//       const registration = await navigator.serviceWorker.register('/service-worker.js');
//       console.log('Service Worker registered with scope:', registration.scope);
//       serviceWorkerRegistered = true;
//       if(serviceWorkerRegistered){
//         alert("yes");
//       }

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

// registerServiceWorkerAndGetToken();
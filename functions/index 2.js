// const functions = require("firebase-functions");
// const admin = require("firebase-admin");

// admin.initializeApp();

// exports.notifyEventUpdate = functions.firestore
//     .document("events/{eventId}")
//     .onUpdate(async (change, context) => {
//       const beforeData = change.before.data();
//       const afterData = change.after.data();

//       if (!change.after.exists) {
//         const eventId = context.params.eventId;
//         const participants = beforeData.participants || [];
//         if (participants.length > 0) {
//           await sendCancellationNotification(eventId, participants);
//         }
//         return null;
//       }

//       // Nothing changed
//       if (JSON.stringify(beforeData) === JSON.stringify(afterData)) {
//         return null;
//       }

//       const eventId = context.params.eventId;
//       const eventTitle = afterData.title;
//       const participants = afterData.participants || [];

//       // Obtain FCM Token of participants on firestore
//       const tokens = (await Promise.all(
//           participants.map(async ( userId ) => {
//             try {
//               const firestore = admin.firestore();
//               const usersCollection = firestore.collection("users");
//               const userDoc = await usersCollection.doc(userId).get();
//               return userDoc?.data()?.fcmToken || null;
//             } catch (error) {
//               console.error(`error: ${eventId}`);
//               return null;
//             }
//           }),
//       )).filter((token) => token !== null);

//       if (tokens.length === 0) {
//         console.log("No participants");
//         return null;
//       }

//       // Send notif through FCM using sendMulticast
//       return admin.messaging().sendMulticast({
//         tokens: tokens,
//         notification: {
//           title: "Updated event!",
//           body: `${eventTitle} was updated`,
//         },
//       })
//           .then((response) => {
//             console.log("Success Notification:", response);
//           })
//           .catch((error) => {
//             console.error("Notification Error:", error);
//           });
//     });

// /**
//  * Notification for event cancel
//  * @param {string} eventId
//  * @param {string[]} participants
//  * @return {Promise<void>}
//  */
// async function sendCancellationNotification(eventId, participants) {
//   const tokens = (await Promise.all(
//       participants.map(async (userId) => {
//         try {
//           const db = admin.firestore();
//           const userRef = db.collection("users").doc(userId);
//           const userDoc = await userRef.get();
//           const userData = userDoc?.data();
//           return userData?.fcmToken ?? null;
//         } catch (error) {
//           console.error("Notification Error:", error);
//           return null;
//         }
//       }),
//   )).filter((token) => token !== null);

//   if (tokens.length > 0) {
//     return admin.messaging().sendMulticast({
//       tokens: tokens,
//       notification: {
//         title: "Event was cancelled",
//         body: "Event was cancelled",
//       },
//     });
//   }
//   return null;
// }

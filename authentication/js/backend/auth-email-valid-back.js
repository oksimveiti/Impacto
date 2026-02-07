import { firebaseConfig } from '../../../../../gitignore/firebase-config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendVerificationEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

import { getFirestore, collection, doc, addDoc, getDoc, updateDoc, deleteDoc, setDoc, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Initialize Firebase and always put this section after import
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// The return is an auth instance;
const auth = getAuth(app);
// start using firestore;
const db = getFirestore(app);

const resendBtn = document.getElementById('resendBtn');

document.addEventListener("DOMContentLoaded", () => {
  // First thing first, doc reference
  // We need the uuid of the user.
  // To get user's uid, onAuthStateChanged is the best way. It is a listener which will give an initial call and also listen to change on auth status.
  // the callback function must be async because there are more callback functions in it.
  // onAuthStateChanged returns an unsubscribe function, which will detach this listener. return void.
  onAuthStateChanged(auth, async (user) => {
    // if a user is in sign-in state, if block will be executed;
    if (user) {
      const userDocRef = doc(db, "users", userObj.uid);

      try {
        userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {  //the exists() is a method of DocumentSnapshot object. Not a JS function but specific to firebase.
          // This is the only reliable way to check if an document really exists at certain reference;
          // !getDoc() can succeed even if the document doesn't exist!
          const userData = userDocSnap.data(); // Turn DocumentSnapshot object into an object containing the document's fields and their values;
          const userEmail = userData.email;

          // first time sending the verification Email automatically after the page is loaded;
          // await will resolve generateEmailVerificationLink(auth, { email: userEmail }) into a string = the link;
          await sendVerificationEmail(userEmail, userData.name, await generateEmailVerificationLink(auth, { email: userEmail }));

          resendBtn.addEventListener("click", async () => {
            try {
              const link = await generateEmailVerificationLink(auth, { email: userEmail });
              await sendCustomVerificationEmail(userEmail, userData.name, link);
              alert("Verification email sent!");
            } catch (error) {
              console.error("Error sending verification email:", error);
              alert("Error sending verification email. Please try again later.");
            }
          });
        } else {
          console.log("User document not found.");
        }
      }
      catch (error) {
        console.error("Error getting user document");
        console.error(error);
        console.error(error.message);
      }
    } else {
      // the user will return null if no user is in sign-in status.
      console.log('User is signed out.');
      // Maybe I can send them back to log-in page.
    }
  });

})
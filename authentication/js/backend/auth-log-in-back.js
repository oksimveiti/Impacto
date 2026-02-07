// I always forget the .js extension; Do not forget;
// I save the firebase-config.js in my local device.
//Every time I switch away and switch back to my branch, the config.js is gone. That's stupid.
import { firebaseConfig } from "../../../config/config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Initialize Firebase and always put this section after import
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// The return is an auth instance;
const auth = getAuth(app);
// start using firestore;
const db = getFirestore(app);

// get input from the log-in page
// DOMContentLoaded means will loaded all the script, invoke the following function;
document.addEventListener("DOMContentLoaded", () => {

  const logInBtn = document.getElementById("logInBtn");

  logInBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.getElementById("formEmail").value;
    const password = document.getElementById("formPassword").value;
    // let uid = userCredential.user.uid;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      const user = userCredential.user;
      console.log(userCredential);
      // to get user's uid and pass to other pages maybe;
      console.log(userCredential.user.uid);
      // ...
      // alert("Sign In successful!");

      // get the user data from database and track all related data;
      const userDocRef = doc(db, "users", userCredential.user.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userDataObj = userDocSnap.data();
          userDataObj.uid = userCredential.user.uid;
          sessionStorage.setItem('userdata', JSON.stringify(userDataObj));
        }
      } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error);
        console.error(errorCode);
        console.error(errorMessage);
      }

      window.location.href = "../../../home/html/home.html";

    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(error);
      console.error(errorCode);
      console.error(errorMessage);
    };
  });

  // const logOutBtn = document.getElementById("logOutBtn");
  // logOutBtn.addEventListener("click", async (event) => {
  //   // for now, no matter you have sign in or what, it will show sign out successful.
  //   event.preventDefault();

  //   try {
  //     const signOutPromise = signOut(auth);
  //     alert("Sign Out Successful");
  //   } catch (error) {
  //     console.log(error);
  //     alert(error.message);
  //   };
  // });

  // test;

  function checkLoginStatus() {
    if (auth.currentUser) {
      console.log(auth.currentUser);
      window.alert(`User ${auth.currentUser.email} is logged in.`);
    } else {
      console.log(auth.currentUser);
      window.alert("User is not logged in.");
    }
  }

});

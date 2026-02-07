
import { firebaseConfig } from '../../../config/config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, getDoc, updateDoc, deleteDoc, setDoc, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);


document.addEventListener("DOMContentLoaded", () => {


  signUpForm.addEventListener('submit', function (event) {

    event.preventDefault();
    // collect all the inputs
    const formName = document.getElementById('formName').value;
    const formSurname = document.getElementById('formSurname').value;
    const formUsername = document.getElementById('formUsername').value;
    const formEmail = document.getElementById('formEmail').value;
    const formPassword = document.getElementById('formPassword').value;

    // The object that will be passed to firebase and also save in sessionStorage;
    let userInput = {
      name: formName,
      surname: formSurname,
      username: formUsername,
      email: formEmail,
      password: formPassword
    }


    async function signUp() {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, formEmail, formPassword);
        console.log("User created:", userCredential.user); //just for testing
        alert("Sign up successful! You are now automatically log-in!");

        // sessionStorage part;
        userInput.uid = userCredential.user.uid;
        // console.log(userInput, 1);//success
        // setItem vs getItem = give and take
        // sessionStorage only accept strings, so convert it first;
        sessionStorage.setItem('userdata', JSON.stringify(userInput));
        // how to get it back
        // let userdata = JSON.parse(sessionStorage.getItem("userdata"));
        // console.log(userdata, 2); //success

        const usersCollectionRef = collection(db, "users");  // Top-level collection named user-data
        const userDocRef = doc(usersCollectionRef, userCredential.user.uid); // Document named with UID

        //setDoc will use the preset UID
        // fix this
        // It will not automatically turn to another page.
        await setDoc(userDocRef, userInput);

        // navigate to another page.
        window.location.href = "./terms-and-condition.html";
      }
      catch (error) {
        console.error("Promise rejected:", error);
        alert(error.message);
      }
    }

    signUp();

  })

})
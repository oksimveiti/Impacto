// import { app, db } from "./firebase.js";
// import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
// import { doc, updateDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// const auth = getAuth(app);


// //1. Change the Password----------------------------------------------------
// const changePasswordButton = document.getElementById("change-password-btn");

// //1-1. Verify input errors.
// changePasswordButton.addEventListener('click', function(event){
//   event.preventDefault();
//   const currentPassword = document.getElementById("current-password");
//   const newPassword = document.getElementById("new-password");
//   const confirmPassword = document.getElementById("confirm-password");

//   // No empty fields
//   if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
//     alert('Please fill all inputs.');
//     document.getElementById('password-change-form').reset();
//     return;
//   }
//   // No inputs errors
//   if (newPassword.value !== confirmPassword.value){
//     alert("Passwords do not match.");
//     document.getElementById('password-change-form').reset();
//     return;
//   }
//   // Complies with the password policy
//   if (validatePassword(newPassword.value)){
//     changePassword(currentPassword.value, newPassword.value);
//   } else {
//     alert("Password does not meet requirements.")
//     document.getElementById('password-change-form').reset();
//   }
// });

// // Password policy
// function validatePassword(password){
 
//   if (password.length < 8) {
//     alert("Password must be at least 8 characters long")
//     return false;
//   }

//   const requirements = {
//     uppercase: /[A-Z]/.test(password),
//     lowercase: /[a-z]/.test(password),
//     number: /[0-9]/.test(password),
//     special:/[!@#$%^&*(),.?":{}|<>]/.test(password),
//   };

//   return Object.values(requirements).every(Boolean);

// }

// //1-2. Match against the database
// function changePassword(currentPassword, newPassword){
//   const user = auth.currentUser;
//   const credential = EmailAuthProvider.credential(user.email, currentPassword);

//   reauthenticateWithCredential(user, credential)
//     .then(() => {
//       return updatePassword(user, newPassword);
//     })
//     .then(() => {
//     alert('Updated successfully!');
//     alert("Your new Password is " + newPassword)
//     document.getElementById('password-change-form').reset();
//     })
//     .catch((error) => {
//       console.log("Password update error;", error);
//       switch(error.code){
//         case 'auth/wrong-password':
//           alert('Wrong password.');
//           document.getElementById('password-change-form').reset();
//           break;
//         default:
//           alert('Failed to update password. Please try again later.');
//           document.getElementById('password-change-form').reset();
//         break;
//     }
//   });
// }


// //2&3 Preparation Common----------------------------------------------------
// onAuthStateChanged(auth,(user) => {
//   if(user) {
//     const uid = user.uid;

//     //2. Push Notification------------------------------------------------------
//     const userRef = doc(db, "users_setting", uid);
//     const notifMain = document.getElementById('notif-main');
//     const notifEvent1 = document.getElementById('event1');
//     const notifEvent2 = document.getElementById('event2');
//     const notifEvent3 = document.getElementById('event3');
//     const notifEvent4 = document.getElementById('event4');
//     const notifEvent5 = document.getElementById('event5');
//     const notifDetails = document.getElementById("notif-details");

//     // 2-1 Obtain the data from firestore and reflect to display
//     getDoc(userRef).then((docSnap) => {
//       if (docSnap.exists()) {
//         const userData = docSnap.data();
      
//         //display based on database
//         notifMain.checked = userData.notificationMain;
//         notifEvent1.checked = userData.notificationEvent1;
//         notifEvent2.checked = userData.notificationEvent2;
//         notifEvent3.checked = userData.notificationEvent3;
//         notifEvent4.checked = userData.notificationEvent4;
//         notifEvent5.checked = userData.notificationEvent5;
      
//         if (userData.notificationMain){
//           notifDetails.style.display = 'block'
//         } else {
//           notifDetails.style.display = 'none';
//         }
      
//       } else {
//         console.log("No such document!");
//       }
//     }).catch((error) => {
//       console.error("Error getting document:", error);
//     });

//     // 2-2. Show detail notification contents depending on Main button
//     notifMain.addEventListener('change', function(){
//       if(this.checked){
//         notifDetails.style.display = 'block';
//       } else {
//         notifDetails.style.display = 'none';
//       }
//     })

//     //2-3. Update the status from client to DB
//     const notifUpdateBtn = document.getElementById('notif-update-btn');
//     notifUpdateBtn.addEventListener('click', function(event) {
//       event.preventDefault();

//       notifUpdateBtn.disabled = true;
//       notifMain.disabled = true;
//       notifEvent1.disabled = true;
//       notifEvent2.disabled = true;
//       notifEvent3.disabled = true;
//       notifEvent4.disabled = true;
//       notifEvent5.disabled = true;
    
//       setTimeout(function() {
//       notifUpdateBtn.disabled = false;
//       notifMain.disabled = false;
//       notifEvent1.disabled = false;
//       notifEvent2.disabled = false;
//       notifEvent3.disabled = false;
//       notifEvent4.disabled = false;
//       notifEvent5.disabled = false;
//       }, 1000);
    
//       const notifMainToggle = notifMain.checked;
//       const notifEvent1Toggle = notifEvent1.checked;
//       const notifEvent2Toggle = notifEvent2.checked;
//       const notifEvent3Toggle = notifEvent3.checked;
//       const notifEvent4Toggle = notifEvent4.checked;
//       const notifEvent5Toggle = notifEvent5.checked;
//       updateDoc( doc( db, "users_setting", uid), {
      
//       "notificationMain": notifMainToggle,
//       "notificationEvent1": notifEvent1Toggle,
//       "notificationEvent2": notifEvent2Toggle,
//       "notificationEvent3": notifEvent3Toggle,
//       "notificationEvent4": notifEvent4Toggle,
//       "notificationEvent5": notifEvent5Toggle,
      
//       })
//       .then(() => {
//         console.log("Document successfully updated!");
//       }).catch((error) => {
//         console.error("Error updating document: ", error);
//       });
//     });

//   }
// });
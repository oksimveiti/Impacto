import { db, auth} from "../../../config/config.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";


// This code handles password updates and notification setting changes.
// Password updates include checks for input errors, confirmation password matching, and authentication with the current password.
// Notification setting changes display toggles for events where 'Attend' has been selected in the event details.


// 1. Notification Setting ****************************************
// 1-1. Obtain data from event DB
async function getNotifSetting(user_id) {
  const userDocRef = doc(db, "users_setting", user_id);
  const userDocSnapshot = await getDoc(userDocRef);

  if (userDocSnapshot.exists()){
    const userData = userDocSnapshot.data();
    let html = ``;

    if(Object.keys(userData).length === 0){
      return "<p>Not registered for the event.</p>"
    }

    for(const eventId in userData){
      if(userData.hasOwnProperty(eventId)){
        const toggleState = userData[eventId];

        const eventName = await getEventName(eventId);
        console.log(eventName);

        html += `
          <div>
            <h3>${eventName}</h3>
            <div class="notif-setting">
              <span>OFF</span>
              <div class="mt-normal-navi">
                <input id="${eventId}" type="checkbox" ${toggleState ? "checked" : ""} />
                <label for="${eventId}"></label>
              </div>
              <span>ON</span>
            </div>
          </div>
        `;
      }
    }
    html += `<button type="submit" id="notifUpdateBtn" class="setting-btn" disabled>Update</button>`;
    return html;
  } else {
    console.log("Not registered for the event.");
    return "<p>Not registered for the event.</p>";
  }
}

// 1-2. Obtain data from user DB(display event_title)
async function getEventName(eventId) {
  try {
    const eventDocRef = doc(db, "events", eventId);
    const eventDocSnapshot = await getDoc(eventDocRef);

    if (eventDocSnapshot.exists()) {
      return eventDocSnapshot.data().title;
    } else {
      console.error(`Event title not found for eventId: ${eventId}`);
      return `Event title not found for eventId: ${eventId}`;
    }
  } catch (error) {
    console.error(`Error fetching event title for eventId: ${eventId}`, error);
    return `Error fetching event title for eventId: ${eventId}`;
  }
}

// (Not used)
// 2. Password Update not used *********************************************
// 2-1. Password Update Form contents
// const passwordUpdateHtml = `
// <section>
//   <form id="passwordUpdateForm" method="POST">
//     <h2>Password update</h2>
//     <label for="passwordUpdateUsername" style="position: absolute; left: -9999px;">Username</label>
// <input type="text" id="passwordUpdateUsername" name="username" autocomplete="username"    style="position: absolute; left: -9999px;">
//     <label for="currentPassword">Current Password: <span style="color: red">required</span></label>
//     <input type="password" id="currentPassword" name="currentPassword" autocomplete="currentPassword">
//     <label for="newPassword">New Password: <span style="color: red">required</span></label>
//     <input type="password" id="newPassword" name="newPassword" autocomplete="newPassword">
//   <label for="confirmPassword">Confirm New Password: <span style="color: red">required</span></ label>
//     <input type="password" id="confirmPassword" name="confirmPassword" autocomplete="newPassword">
//     <p>Your new password must:</p>
//     <p>- Contain at least one uppercase letter.</p>
//     <p>- Contain at least one lowercase letter.</p>
//     <p>- Contain at least one number.</p>
//     <p>- Contain at least one special character.</p>
//     <p>- Be at least 8 characters long.</p>
//     <button type="submit" id="passwordUpdateBtn" class="setting-btn">Change Password</button>
//   </form>
// </section>
// `;

// 2-2. Password policy
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

// 2-3. Verify password input
// function handlePasswordUpdate(event) {
//   event.preventDefault();

//   const currentPassword = document.getElementById("currentPassword");
//   const newPassword = document.getElementById("newPassword");
//   const confirmPassword = document.getElementById("confirmPassword");

//   // No empty fields
//   if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
//     alert('Please fill all inputs.');
//     document.getElementById('passwordUpdateForm').reset();
//     return;
//   }

//   // No inputs errors
//   if (newPassword.value !== confirmPassword.value) {
//     alert("Passwords do not match.");
//     document.getElementById('passwordUpdateForm').reset();
//     return;
//   }

//   // Complies with the password policy
//   if (validatePassword(newPassword.value)) {
//     passwordUpdate(currentPassword.value, newPassword.value);
//   } else {
//     alert("Password does not meet requirements.");
//     document.getElementById('passwordUpdateForm').reset();
//   }
// }

// 2-4. Update password with verifying currentPassword
// function passwordUpdate(currentPassword, newPassword){
//   const user = auth.currentUser;
//   const credential = EmailAuthProvider.credential(user.email, currentPassword);

//   reauthenticateWithCredential(user, credential)
//     .then(() => {
//       return updatePassword(user, newPassword);
//     })
//     .then(() => {
//     alert('Updated successfully!');
//     // alert("Your new Password is " + newPassword)
//     document.getElementById('passwordUpdateForm').reset();
//     })
//     .catch((error) => {
//       console.log("Password update error;", error);
//       switch(error.code){
//         case 'auth/wrong-password':
//           alert('Wrong password.');
//           document.getElementById('passwordUpdateForm').reset();
//           break;
//         default:
//           alert('Failed to update password. Please try again later.');
//           document.getElementById('passwordUpdateForm').reset();
//         break;
//     }
//   });
// }


// 3. After Loading HTML *******************************************
document.addEventListener('DOMContentLoaded', async function() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const user_id = user.uid;
      const settingsContentElement = document.getElementById('settingsContent');

      // // Password update eventlistener
      // // Display password update form
      // document.getElementById('passwordUpdate').addEventListener('click', function() {
      //   settingsContentElement.innerHTML = passwordUpdateHtml;
      //   // Update password
      //   document.getElementById('passwordUpdateForm').addEventListener('submit', handlePasswordUpdate);
      // });

      // Notification setting eventlistener
      // Display notification setting form and obtain the data from firestore
      document.getElementById('notificationSetting').addEventListener('click', async function() {
        // Obtain the events toggle condition and display in the form
        try {
          const notifSettingHtml = await getNotifSetting(user_id);
          settingsContentElement.innerHTML = notifSettingHtml;

          // Once change toggle, update button will be able to push.
          settingsContentElement.addEventListener('change', (event) => {
            if (event.target.matches('input[type="checkbox"]')) {
              document.getElementById('notifUpdateBtn').disabled = false;
            }
          });

          // Update toggle status by user's change
          document.getElementById('notifUpdateBtn').addEventListener('click', async () => {
            const updatedUserData = {};
            settingsContentElement.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
              updatedUserData[checkbox.id] = checkbox.checked;
            });

            const userDocRef = doc(db, "users_setting", user_id);
            await setDoc(userDocRef, updatedUserData);
            alert("Updated setting");
            document.getElementById('notifUpdateBtn').disabled = true;
          });
        } catch (error) {
          console.error("Failed to obtain data from DB:", error);
          settingsContentElement.innerHTML = "<p>Failed to obtain data from DB</p>";
        }
      });
    } else {
      console.log("User not found");
    }
  });
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "../../../config/config.js";
import { STORAGE_KEYS, storageHelpers } from "../backend/storage-helpers.js";
import {
  doc,
  setDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  ref,
  uploadString,
  getDownloadURL,
  getStorage,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener("DOMContentLoaded", function () {
  // Setup auth state listener
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Current user:", user);

    if (!user) {
      console.log("No user found - redirecting to login");
      window.location.href =
        "../../../authentication-Francisco/html/log-in.html";
      return;
    }

    if (user) {
      const userInfo = document.getElementById("userInfo");
      console.log("userInfo element:", userInfo);
      if (userInfo) {
        userInfo.textContent = `Test to make sure auth is working, your User ID: ${user.uid}, Email: ${user.email}, Display Name: ${user.displayName}`;
        userInfo.style.fontSize = ".8rem";
        userInfo.style.color = "hotpink";
        userInfo.style.marginTop = "10px";
        userInfo.style.marginBottom = "10px";
      } else {
        console.log("userInfo element not found");
      }

      console.log(`Your User ID: ${user.uid}, Email: ${user.email}`);

      // Now we know we have a user, initialize the page
      initializeProfileSummary(user);
    }
  });

  // Clean up the listener when page is unloaded
  window.addEventListener("unload", () => {
    unsubscribe();
  });

  function initializeProfileSummary(user) {
    // Add debug logs
    console.log("Stored data in session:");
    try {
      const bio = storageHelpers.get(STORAGE_KEYS.BIO);
      console.log("Bio (raw):", sessionStorage.getItem(STORAGE_KEYS.BIO));
      console.log("Bio (parsed):", bio);
      console.log("Gender:", storageHelpers.get(STORAGE_KEYS.GENDER));
      console.log("Hobbies:", storageHelpers.get(STORAGE_KEYS.HOBBIES));
      console.log(
        "Event Preferences:",
        storageHelpers.get(STORAGE_KEYS.EVENT_PREFS)
      );
      console.log("Location:", storageHelpers.get(STORAGE_KEYS.LOCATION));
      console.log(
        "Notifications:",
        storageHelpers.get(STORAGE_KEYS.NOTIFICATIONS)
      );
      console.log("Privacy:", storageHelpers.get(STORAGE_KEYS.PRIVACY));
    } catch (e) {
      console.error("Error reading stored data:", e);
    }

    // Get all the elements we need
    const elements = {
      profilePicture: document.getElementById("previewProfilePicture"),
      bio: document.getElementById("previewBio"),
      gender: document.getElementById("previewGender"),
      hobbies: document.getElementById("previewHobbies"),
      notifications: document.getElementById("previewNotifications"),
      privacy: document.getElementById("previewPrivacy"),
      location: document.getElementById("previewLocation"),
      goBackButton: document.getElementById("goBack"),
      finalizeButton: document.getElementById("finalizeProfile"),
    };

    // Debug: Check if elements are found
    console.log("Found elements:", elements);

    const userId = user.uid;

    // Load profile picture
    const profilePic = storageHelpers.get(STORAGE_KEYS.PROFILE_PIC);
    if (profilePic) {
      elements.profilePicture.src = profilePic;
      elements.profilePicture.style.display = "block";
    }

    // Load bio
    elements.bio.textContent = storageHelpers.get(
      STORAGE_KEYS.BIO,
      "No bio provided."
    );

    // Load gender
    const genderMap = {
      male: "Male",
      female: "Female",
      "non-binary": "Non-binary",
      other: "Other",
      "": "Prefer not to say",
    };
    const savedGender = storageHelpers.get(STORAGE_KEYS.GENDER);
    elements.gender.textContent = genderMap[savedGender] || "Not specified";

    // Load hobbies
    const hobbies = storageHelpers.get(STORAGE_KEYS.HOBBIES, []);
    if (hobbies.length > 0) {
      elements.hobbies.innerHTML = hobbies
        .map((hobby) => `<li>${hobby}</li>`)
        .join("");
    }

    // Load event preferences
    const eventPreferences = storageHelpers.get(STORAGE_KEYS.EVENT_PREFS, []);
    if (eventPreferences.length > 0) {
      const eventPrefsSection = document.createElement("div");
      eventPrefsSection.className = "field-group";
      eventPrefsSection.innerHTML = `
      <h2>Event Preferences</h2>
      <ul>
        ${eventPreferences.map((pref) => `<li>${pref}</li>`).join("")}
      </ul>
    `;
      elements.hobbies.parentElement.after(eventPrefsSection);
    }

    // Load notification preferences
    const notificationMap = {
      email: "Email Only",
      push: "Push Notifications Only",
      both: "Both Email and Push",
      none: "No Notifications",
    };
    const savedNotifications = storageHelpers.get(STORAGE_KEYS.NOTIFICATIONS);
    elements.notifications.textContent =
      notificationMap[savedNotifications] || "Not specified";

    // Load privacy settings
    const privacyMap = {
      public: "Public Profile",
      friends: "Friends Only",
      private: "Private Profile",
    };
    const savedPrivacy = storageHelpers.get(STORAGE_KEYS.PRIVACY);
    elements.privacy.textContent = privacyMap[savedPrivacy] || "Not specified";

    // Load location
    const savedLocation = storageHelpers.get(STORAGE_KEYS.LOCATION);
    elements.location.textContent = savedLocation || "Not specified";

    // Handle button clicks
    if (elements.goBackButton) {
      elements.goBackButton.addEventListener("click", function () {
        window.location.href = "profileSetup.html";
      });
    }

    if (elements.finalizeButton) {
      elements.finalizeButton.addEventListener("click", async function () {
        try {
          // Collect all data for submission
          let profilePictureUrl = "";
          const profilePicData = storageHelpers.get(STORAGE_KEYS.PROFILE_PIC);

          if (profilePicData) {
            const storageRef = ref(storage, `profile_pictures/${userId}`);

            const base64Data = profilePicData.split(",")[1];
            await uploadString(storageRef, base64Data, "base64");
            profilePictureUrl = await getDownloadURL(storageRef);
          }

          const profileData = {
            basicInfo: {
              bio: storageHelpers.get(STORAGE_KEYS.BIO, ""),
              gender: storageHelpers.get(STORAGE_KEYS.GENDER, ""),
              profilePictureUrl: profilePictureUrl,
              lastUpdated: new Date(),
            },
            interests: {
              /*eventPreferences: {
              animal_rights: false,
              community_support: false,
              cultural: false,
              education: false,
              environmental: false,
              health_awareness: false,
              human_rights: false,
              others: false,
              political: false,
              social_activism: false,
              social_justice: false,
            },*/
              eventPreferences: storageHelpers.get(
                STORAGE_KEYS.EVENT_PREFS,
                []
              ),
              hobbies: storageHelpers.get(STORAGE_KEYS.HOBBIES, []),
            },
            location: {
              address: storageHelpers.get(STORAGE_KEYS.LOCATION, ""),
              coordinates: {
                latitude: 0,
                longitude: 0,
              },
              type: "manual",
            },
            preferences: {
              notifications: storageHelpers.get(
                STORAGE_KEYS.NOTIFICATIONS,
                "email"
              ),
              privacy: storageHelpers.get(STORAGE_KEYS.PRIVACY, "private"),
            },
            setupStatus: "complete",
          };

          console.log("Submitting profile data...", profileData);
          // Save to Firestore
          const userDocRef = doc(db, "profile_setup", userId); // User ID from auth
          await setDoc(userDocRef, profileData);

          console.log("Profile saved to Firestore successfully!");
          alert("Profile saved successfully!");

          // Clear session storage after submission
          // sessionStorage.clear();

          // Redirect to home page
          window.location.href = "../../../../home/html/home.html";
        } catch (error) {
          console.error("Error saving profile:", error);
          alert("Error saving profile. Please try again.");
        }
      });
    }
  }
});

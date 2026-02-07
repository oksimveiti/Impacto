import {
  getAuth,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { firebaseConfig } from "../../../config/config.js";

// Firebase servislerini başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Function to get the current user ID
function getCurrentUserId() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated!");
  }
  return user.uid;
}

// Function to load user data from Firebase
export async function getUserData() {
  try {
    const userId = getCurrentUserId();
    const userDocRef = doc(db, "profile_setup", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.error("No user data found!");
      return null;
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    throw error;
  }
}

// Function to update profile settings
// Update this part in your updateProfileSettings function in settings-service.js
export async function updateProfileSettings(profileData) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userId = user.uid;
  const userDocRefInUsers = doc(db, "users", userId);

  try {
    // Firebase Auth'da e-posta veya displayName değiştiyse güncelle
    if (profileData.basicInfo.displayName !== user.displayName) {
      // Gerekiyorsa Auth'da displayName'i güncelle
      await updateProfile(user, {
        displayName: profileData.basicInfo.displayName,
      });
      console.log("Auth displayName updated");
    }

    // Firestore'da güncelle
    const userDocRef = doc(db, "profile_setup", userId);

    // Önce mevcut verileri al
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      // Belge yoksa oluştur
      await setDoc(userDocRef, {
        basicInfo: profileData.basicInfo,
        location: profileData.location,
        setupStatus: "complete",
      });
      console.log("New profile document created");
    } else {
      // Mevcut belgeyi güncelle
      const userData = docSnap.data();

      // basicInfo nesnesini derin birleştirme yap
      const updatedBasicInfo = {
        ...userData.basicInfo,
        ...profileData.basicInfo,
      };

      // location nesnesini derin birleştirme yap
      const updatedLocation = {
        ...userData.location,
        ...profileData.location,
      };

      // Sadece değişen alanları güncelle
      await updateDoc(userDocRef, {
        basicInfo: updatedBasicInfo,
        location: updatedLocation, // Tüm location nesnesini güncelle
      });
      console.log("Profile document updated");
    }

    if (profileData.basicInfo?.displayName) {
      await updateDoc(userDocRefInUsers, {
        username: profileData.basicInfo.displayName,
      });
      console.log("Username updated in users collection");
    }

    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// function to update preference settings
export async function updatePreferenceSettings(interests, hobbies) {
  try {
    const userId = getCurrentUserId();
    const userDocRef = doc(db, "profile_setup", userId);

    await updateDoc(userDocRef, {
      "interests.eventPreferences": interests,
      "interests.hobbies": hobbies || [],
    });

    return true;
  } catch (error) {
    console.error("Error updating preferences", error);
    throw error;
  }
}

// Function to update notification settings
// export async function updateNotificationSettings(notificationSettings) {
//   try {
//     const userId = getCurrentUserId();
//     const userDocRef = doc(db, "profile_setup", userId);

//     await updateDoc(userDocRef, {
//       "preferences.notifications": notificationSettings,
//     });
//     return true;
//   } catch (error) {
//     console.error("Error updating notification settings:", error);
//     throw error;
//   }
// }

// Function to upload profile picture
export async function uploadProfilePicture(dataUrl) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userId = user.uid;

  try {
    // Firebase Storage'a yükle
    const storageRef = ref(storage, `profile_pictures/${userId}`);

    // Base64 veri kısmını çıkar (data:image/jpeg;base64, önekini kaldır)
    const base64Data = dataUrl.split(",")[1];

    // String'i storage'a yükle
    await uploadString(storageRef, base64Data, "base64");

    // İndirme URL'sini al
    const profilePictureUrl = await getDownloadURL(storageRef);

    // Firestore'daki URL'yi güncelle
    const userDocRef = doc(db, "profile_setup", userId);
    await updateDoc(userDocRef, {
      "basicInfo.profilePictureUrl": profilePictureUrl,
      "basicInfo.lastUpdated": new Date(),
    });

    console.log("Profile picture uploaded and URL saved:", profilePictureUrl);

    return profilePictureUrl;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

export async function getUserDataWithAuthCheck() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // console.log("Current user in getUserData:", user);
          // Firestore'dan kullanıcı verilerini al
          const userId = user.uid;
          const userDocRef = doc(db, "profile_setup", userId);
          const docSnap = await getDoc(userDocRef);

          // Fetch username from users collection
          const userDocFromUsers = await getDoc(doc(db, "users", userId));
          const username = userDocFromUsers.exists() ? userDocFromUsers.data().username : "";

          if (docSnap.exists()) {
            const userData = docSnap.data();
            // console.log("User data from Firestore:", userData);

            // Auth verilerini ekleyerek e-posta ve displayName'i garantileyelim
            userData.auth = {
              email: user.email,
              displayName: username || user.displayName || user.email?.split("@")[0] || "User",
            };

            resolve(userData);
          } else {
            console.log("No user data found in Firestore!");
            // Firestore'da veri yoksa bile en azından auth verilerini döndürelim
            resolve({
              auth: {
                email: user.email,
                displayName: username || user.displayName || user.email?.split("@")[0] || "User",
              },
              basicInfo: {
                email: user.email,
              },
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          reject(error);
        }
      } else {
        console.log("No user signed in - redirecting");
        window.location.href =
          "../../../authentication-Francisco/html/log-in.html";
        reject("No user signed in");
      }
    });
  });
}

// Şifre ayarları ekranını yükle
function loadPasswordSettings() {
  const html = `
        <div class="settings-header">
          <h2>Account Setting</h2>
          
          <div class="settings-tabs">
            <div class="tab" data-tab="preference">Preference Setting</div>
            <div class="tab" data-tab="notification">Notification Setting</div>
            <div class="tab active" data-tab="password">Change Password</div>
          </div>
        </div>
        
        <div class="settings-content">
          <div class="password-form">
            <h3>Change Your Password</h3>
            <p>Please enter your current password and a new password to update.</p>
            
            <div class="field-group">
              <label for="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" class="form-control">
            </div>
            
            <div class="field-group">
              <label for="newPassword">New Password</label>
              <input type="password" id="newPassword" class="form-control">
              <p class="hint-text">Password must be at least 8 characters long.</p>
            </div>
            
            <div class="field-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input type="password" id="confirmPassword" class="form-control">
            </div>
            
            <div style="text-align: right; margin-top: 30px;">
              <button id="changePasswordBtn" class="btn">Change Password</button>
            </div>
          </div>
        </div>
      `;

  settingsContent.innerHTML = html;

  // Şifre değiştirme butonu için olay dinleyicisi ekle
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async function () {
      try {
        changePasswordBtn.disabled = true;
        changePasswordBtn.textContent = "Changing...";

        // Form değerlerini al
        const currentPassword =
          document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword =
          document.getElementById("confirmPassword").value;

        // Girdileri doğrula
        if (!currentPassword) {
          alert("Please enter your current password.");
          return;
        }

        if (!newPassword) {
          alert("Please enter a new password.");
          return;
        }

        if (newPassword.length < 8) {
          alert("Password must be at least 8 characters long.");
          return;
        }

        if (newPassword !== confirmPassword) {
          alert("New passwords do not match.");
          return;
        }

        // Şifreyi güncelle
        await updateUserPassword(currentPassword, newPassword);

        // Başarı mesajı göster
        showSuccessMessage("Password has been updated successfully");

        // Formu temizle
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
      } catch (error) {
        console.error("Error changing password:", error);
        if (error.code === "auth/wrong-password") {
          alert("Current password is incorrect. Please try again.");
        } else if (error.code === "auth/weak-password") {
          alert("New password is too weak. Please choose a stronger password.");
        } else {
          alert("Failed to change password. Please try again.");
        }
      } finally {
        changePasswordBtn.disabled = false;
        changePasswordBtn.textContent = "Change Password";
      }
    });
  }
}

export async function updateUserPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  if (!user.email) throw new Error("User has no email");

  try {
    // Önce kullanıcıyı yeniden doğrula
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Sonra şifreyi güncelle
    await updatePassword(user, newPassword);

    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}

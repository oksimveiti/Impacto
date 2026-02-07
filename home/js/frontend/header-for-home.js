import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "../../../config/config.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


document.addEventListener("DOMContentLoaded", function () {
  console.log("heiheihei!");
  const userMenuButton = document.querySelector(".user-menu-button");
  const userMenuDropdown = document.querySelector(".user-menu-dropdown");
  const logoutButton = document.getElementById("logoutButton");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  const userNameMobile = document.getElementById("userName-mobile");

  // ドロップダウンメニューの表示/非表示
  userMenuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenuDropdown.classList.toggle("active");
  });

  // ドロップダウン以外をクリックしたら閉じる
  document.addEventListener("click", () => {
    userMenuDropdown.classList.remove("active");
  });

  // ログアウト処理
  logoutButton.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      alert("Sign Out Successful");
      window.location.href =
        "../../../authentication-Francisco/html/log-in.html";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  });

  // ユーザー情報の表示
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // プロフィール情報を取得
        const profileDoc = await getDoc(doc(db, "profile_setup", user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          if (profileData.basicInfo?.profilePictureUrl) {
            userAvatar.src = profileData.basicInfo.profilePictureUrl;
          }
        }

        // ユーザー名を取得
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          console.log("heiheihei!")
          userName.textContent = userDoc.data().username || user.email;
          userNameMobile.textContent = userDoc.data().username || user.email;
        } else {
          userName.textContent = user.email;
          userNameMobile.textContent = user.email;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        userName.textContent = user.email;
        userNameMobile.textContent = user.email;
      }
    }
  });

  // モーダル関連の処理を追加
  const createButton = document.querySelector(".create-button");
  const modal = document.getElementById("eventTypeModal");

  createButton.addEventListener("click", function (e) {
    e.preventDefault();
    modal.classList.add("active");
  });

  // モーダルの外側をクリックして閉じる
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // ESCキーでモーダルを閉じる
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
  });
  document.getElementById("createBtn1").addEventListener('click', () => {
    modal.classList.add("active");
  });

  document.getElementById("createBtn2").addEventListener('click', () => {
    modal.classList.add("active");
  });
});



//Search function implemented by Yun
let allEventsArray = [];
const searchBtn = document.querySelector(".search-button");
searchBtn.addEventListener("click", searchEvents);

// window.addEventListener("Storage", (e) => {
//   if (e.key === "allEventsData" ) {
//     allEventsArray = JSON.parse(localStorage.getItem("allEventsData") || "[]");
//     console.log("allEventsArray: ",allEventsArray)
//   }
// })

function searchEvents() {
  allEventsArray = JSON.parse(localStorage.getItem("allEventsData") || "[]");

  // initialize
  sessionStorage.removeItem("searchedEvents");

  const searchedEvents = createSearchedEventsArr();

  if (searchedEvents.length !== 0) {
    sessionStorage.setItem("searchedEvents", JSON.stringify(searchedEvents));
  }
  window.location = `http://127.0.0.1:5504/home/html/search-result.html`;
}

const wordInput = document.getElementById("eventSearch");
const locationInput = document.getElementById("locationSearch");

function createSearchedEventsArr() {
  // allEventsArray
  let searchedEvents = [];
  let searchWordsArr = [];
  let searchCitiesArr = [];

  if (wordInput.value !== "") {
    searchWordsArr = wordInput.value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .split(" ");
  }

  if (locationInput.value !== "") {
    searchCitiesArr = locationInput.value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .split(" ");
  }

  if (searchWordsArr.length === 0 && searchCitiesArr.length === 0) {
    window.location.href =
      "http://127.0.0.1:5504/list-view/html/list-view.html";
  }

  // When only search words are input
  if (searchWordsArr.length !== 0 && searchCitiesArr.length === 0) {
    for (const eachEvent of allEventsArray) {
      if (eachEvent.status !== "publish" && eachEvent.status !== "published") {
        continue;
      }
      for (const searchWord of searchWordsArr) {
        if (eachEvent.title.toLowerCase().includes(searchWord)) {
          searchedEvents.push(eachEvent);
          break;
        }
        if (eachEvent.description.toLowerCase().includes(searchWord)) {
          searchedEvents.push(eachEvent);
          break;
        }
      }
    }
    return searchedEvents;
  }

  // when only search locations are input
  if (searchWordsArr.length === 0 && searchCitiesArr.length !== 0) {
    for (const eachEvent of allEventsArray) {
      if (eachEvent.status !== "publish" && eachEvent.status !== "published") {
        continue;
      }
      for (const searchCity of searchCitiesArr) {
        if (eachEvent.city.toLowerCase().includes(searchCity)) {
          searchedEvents.push(eachEvent);
          break;
        }
      }
    }

    console.log(searchedEvents);
    return searchedEvents;
  }

  // if both of search words and cities are input
  if (searchWordsArr.length !== 0 && searchCitiesArr.length !== 0) {
    let includingSeachedWords = false;
    let isSearchedCity = false;

    for (const eachEvent of allEventsArray) {
      if (eachEvent.status !== "publish" && eachEvent.status !== "published") {
        continue;
      }
      includingSeachedWords = false;
      isSearchedCity = false;

      // Check City
      for (const searchCity of searchCitiesArr) {
        if (eachEvent.city.toLowerCase().includes(searchCity)) {
          isSearchedCity = true;
          break;
        }
      }

      for (const searchWord of searchWordsArr) {
        if (
          eachEvent.title.includes(searchWord) ||
          eachEvent.description.includes(searchWord)
        ) {
          includingSeachedWords = true;
          break;
        }
      }

      if (includingSeachedWords && isSearchedCity) {
        searchedEvents.push(eachEvent);
      }
    }
    return searchedEvents;
  }
}

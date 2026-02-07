import { GOOGLE_MAPS_API_KEY, MAP_ID } from "../../../config/config.js"; //get API Key
import { editEventToFirestore } from "../backend/edit-firestore.js";
import { initializeTinyMCE } from "../../../create-event-Naomi/js/js/frontend/tinyMCE-config.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { firebaseConfig } from "../../../config/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, doc, getDoc, Timestamp, updateDoc, arrayRemove, arrayUnion, deleteDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==============================================================
// Global Function 1　Form Validation Message;
// ==============================================================

// Validation Message - 最初に関数を定義
function showValidationMessage(inputElement, message) {
  console.log(
    `Showing validation message for ${inputElement.id || "unknown element"}`
  );

  // 親要素のform-groupを取得
  const formGroup = inputElement.closest(".form-group");
  if (!formGroup) {
    console.error("No form-group found for", inputElement.id);
    return;
  }

  // form-groupのエラー状態をリセット
  formGroup.classList.remove("error");

  // 既存のエラーメッセージを削除
  const existingError = formGroup.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // エラーメッセージ要素を作成
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;

  // form-groupの最後にエラーメッセージを挿入
  formGroup.appendChild(errorDiv);

  // form-group全体にエラースタイルを適用
  formGroup.classList.add("error");

  console.log("Error message inserted for", inputElement.id);
}

// ================================================
// Global Functions 1 ends here
// ================================================

// Francisco Part;
// Got the object from the DB
let eventObj = [];
// expected Obj:
let eventId = sessionStorage.getItem('EditeventId'); //success pass the eventUid
// console.log(eventId, typeof eventId);
async function getEventObjFromDB(eventUid) {
  try {
    const eventDocRef = doc(db, "events", eventUid);
    const eventDocSnap = await getDoc(eventDocRef);

    if (eventDocSnap.exists()) {
      const eventData = eventDocSnap.data();
      const image_url = eventData.image_url;
      const event_start_date_time = eventData.event_start_date_time;
      const event_end_date_time = eventData.event_end_date_time;
      const petition_start_date_time = eventData.petition_start_date_time;
      const petition_end_date_time = eventData.petition_end_date_time;
      const location = eventData.location;
      const max_participants = eventData.max_participants;
      const event_categories = eventData.event_categories;
      const description = eventData.description;
      eventObj.push(image_url);
      if (event_start_date_time == null || event_end_date_time == null) {
        convertTimeStampCADDay(petition_start_date_time, petition_end_date_time);
        eventObj.push(petition_start_date_time);
        eventObj.push(petition_end_date_time);
      } else if (petition_start_date_time == null || petition_end_date_time == null) {
        convertTimeStampCADDay(event_start_date_time, event_end_date_time);
        eventObj.push(event_start_date_time);
        eventObj.push(event_end_date_time);
      }
      eventObj.push(location);
      eventObj.push(max_participants);
      eventObj.push(event_categories);
      eventObj.push(description);
    } else {
      console.log(`Document events/${eventUid} does not exist.`);
      return null; // Return a promise which can be resolved into null if the document doesn't exist
    }
  } catch (error) {
    console.error("getDoc is not working:", error);
  }
}

// Function change timestamp to human readable;
function convertTimeStampCADDay(startStamp, endStamp) {


  const startDate = startStamp.toDate(); // Convert to JavaScript Date
  // This date is already Vancouver Time Zone = PST = PT = UT-8;
  // console.log(startDate, 'date');
  // date format: 
  // Sat Mar 29 2025 13:00:00 GMT-0700 (Pacific Daylight Time)
  // Time zone will automatically follow your location;
  const endDate = endStamp.toDate();

  // start time
  const startDay = String(startDate.getDate()).padStart(2, '0');
  console.log(startDay, 'startDay');
  const startWeekIndex = startDate.getDay(); // 0 (Sunday) to 6 (Saturday)
  console.log(startWeekIndex, 'startWeekIndex');
  // month
  const startMonthIndex = startDate.getMonth();
  const startMonth = monthOfYearArray[startMonthIndex];
  const startHour = String(startDate.getHours()).padStart(2, '0');

  // end time;
  const endHour = String(endDate.getHours()).padStart(2, '0');
  const convertArray = [startDay, startWeekName, startMonth, startHour, endHour];
  return convertArray; //it works

}
// timestamp convert end
getEventObjFromDB(eventId);
console.log(eventObj);

// Francisco end

// グローバルスコープに定義
let selectedCategories = [];

const TESTING = false; // 開発時のみtrueに設定

// DOMContentLoadedの前に関数を定義
function initializeEventPage() {
  console.log("Initializing event page...");

  // フォーム要素の取得
  const imageInput = document.getElementById("eventImage");
  const titleInput = document.getElementById("eventTitle");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");
  const errorMessage = document.getElementById("error-message");
  const eventLocationInput = document.getElementById("eventLocation");
  const eventCapacityInput = document.getElementById("eventCapacity");
  const eventDetailsInput = document.getElementById("eventDetails");
  const eventForm = document.getElementById("eventForm");
  const clearEventButton = document.getElementById("clearEventButton");

  // エラークリアの初期化
  initializeErrorClear();

  // カテゴリーボタンの初期化
  initializeCategoryButtons();

  // 画像プレビューの処理
  initializeImagePreview(imageInput);

  // DOMの準備ができてから少し遅延させてTinyMCEを初期化
  setTimeout(() => {
    initializeTinyMCE();
  }, 500);

  // Clear Allボタンの処理
  clearEventButton.addEventListener("click", () => {
    // フォームのリセット
    eventForm.reset();

    // 画像プレビューのクリア
    const imagePreview = document.getElementById("imagePreview");
    imagePreview.innerHTML = "";

    // TinyMCEエディタのリセット
    tinymce.get("eventDetails").setContent("");

    // カテゴリーボタンのリセット
    const categoryButtons = document.querySelectorAll(".category-btn");
    categoryButtons.forEach((button) => {
      button.classList.remove("selected");
    });
    document.getElementById("selectedCategory").value = "";

    // エラー表示のクリア
    const formGroups = document.querySelectorAll(".form-group");
    formGroups.forEach((group) => {
      group.classList.remove("error");
      const errorMessage = group.querySelector(".error-message");
      if (errorMessage) {
        errorMessage.remove();
      }
    });

    // 地図を初期位置にリセット
    const defaultLocation = { lat: 49.2827, lng: -123.1207 };
    const map = new google.maps.Map(document.getElementById("map"), {
      center: defaultLocation,
      zoom: 12,
      language: "en",
      mapId: MAP_ID,
    });

    // プログレスバーをcreateステップに戻す
    updateProgressBar("create");

    // フォームを編集モードに戻す
    eventForm.classList.remove("review-mode", "visible");

    // ページトップにスムーズにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // フォーム送信の処理
  if (eventForm) {
    // Enterキーでの送信を防ぐ
    eventForm.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        return false;
      }
    });

    // Save Draftボタンのイベントリスナー
    document
      .getElementById("saveDraftButton")
      .addEventListener("click", async function (e) {
        e.preventDefault();
        if (validateDraftForm()) {
          const formData = collectFormData();
          console.log("Draft form data:", formData);
          formData.status = "draft";

          try {
            // 新規ドラフトを作成
            const eventId = await editEventToFirestore(formData);
            // console.log("Saved draft with ID:", eventId);
            sessionStorage.setItem("createdEventId", eventId);
            window.location.href =
              "../../../create-event-Naomi/html/draft-saved.html";
          } catch (error) {
            console.error("Failed to save draft:", error);
            console.error("Error details:", error.message);
            alert("Failed to save draft. Please try again.");
          }
        }
      });

    eventForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (validateForm()) {
        const formData = collectFormData();
        formData.status = ""; // 一時的に空のステータスを設定

        try {
          // フォームを非表示にしてから表示
          const form = document.getElementById("eventForm");
          form.classList.add("review-mode");
          window.scrollTo({ top: 0, behavior: "auto" });

          // 少し遅延させて表示（トランジション効果のため）
          setTimeout(() => {
            form.classList.add("visible");
          }, 50);

          // プログレスバーの更新
          updateProgressBar("review");

          // Save & Continueボタンを非表示にし、Publishボタンを表示
          document.getElementById("saveContinueButton").style.display = "none";

          // 既存のPublishボタンがあれば削除
          const existingPublishButton = document.querySelector(
            'button.btn-blue:not([type="submit"])'
          );
          if (existingPublishButton) {
            existingPublishButton.remove();
          }

          const publishButton = document.createElement("button");
          publishButton.className = "btn-blue";
          publishButton.textContent = "Publish";
          publishButton.addEventListener("click", async () => {
            try {
              formData.status = "publish"; // 公開ステータスを設定
              const eventId = await editEventToFirestore(formData);
              // sessionStorage.setItem("createdEventId", eventId);
              alert("Event Edit success!");
              window.location.href =
                "./my-event.html";
            } catch (error) {
              console.error("Failed to save event:", error);
              alert("Failed to publish event. Please try again.");
            }
          });
          document.querySelector(".button-group").appendChild(publishButton);
        } catch (error) {
          console.error("Error updating page:", error);
          alert("An error occurred. Please try again.");
        }
      }
    });
  }
}

// 画像プレビューの初期化関数
function initializeImagePreview(imageInput) {
  console.log("Initializing image preview...");
  const previewContainer = document.getElementById("imagePreview");

  if (!imageInput || !previewContainer) {
    console.error("Required elements not found:", {
      imageInput: !!imageInput,
      previewContainer: !!previewContainer,
    });
    return;
  }

  imageInput.addEventListener("change", function (e) {
    console.log("File input changed");
    previewContainer.innerHTML = "";

    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file.name, file.type);

      if (!file.type.startsWith("image/")) {
        console.error("Selected file is not an image");
        return;
      }

      const reader = new FileReader();

      reader.onload = function (e) {
        console.log("File loaded successfully");
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.borderRadius = "4px";
        img.style.marginTop = "10px";

        previewContainer.appendChild(img);
      };

      reader.onerror = function (e) {
        console.error("Error reading file:", e);
      };

      reader.readAsDataURL(file);
    } else {
      console.log("No file selected");
    }
  });

  console.log("Image preview initialization complete");
}

// カテゴリーボタンの初期化関数
function initializeCategoryButtons() {
  console.log("Initializing category buttons...");
  const categoryButtons = document.querySelectorAll(".category-btn");
  const selectedCategoryInput = document.getElementById("selectedCategory");
  let selectedCategories = [];

  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.dataset.category;

      if (this.classList.contains("selected")) {
        // カテゴリーの選択を解除
        this.classList.remove("selected");
        selectedCategories = selectedCategories.filter(
          (cat) => cat !== category
        );
      } else {
        // カテゴリーを選択
        this.classList.add("selected");
        selectedCategories.push(category);
      }

      // 選択されたカテゴリーを隠しフィールドに設定
      selectedCategoryInput.value = selectedCategories.join(",");

      console.log("Selected categories:", selectedCategories);
    });
  });
}

// Google Maps関連のコードも必要なので残す
window.initMap = function () {
  try {
    const defaultLocation = { lat: 49.2827, lng: -123.1207 };

    const map = new google.maps.Map(document.getElementById("map"), {
      center: defaultLocation,
      zoom: 12,
      language: "en",
      mapId: MAP_ID,
    });
    console.log("Map initialized successfully");

    // ensure if geolocation is available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(currentLocation);
          map.setZoom(12);

          new google.maps.Marker({
            map: map,
            position: currentLocation,
            title: "You are here",
          });
        },

        (error) => {
          console.error("Error getting current position:", error);
          map.setCenter(defaultLocation);
          map.setZoom(12);
        }
      );
    }

    // グローバルで使用できるようにマーカー変数を定義
    let currentMarker = null;

    const input = document.getElementById("eventLocation");
    const autocomplete = new google.maps.places.Autocomplete(input);

    // Autocomplete のイベントリスナー
    autocomplete.addListener("place_changed", function () {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        map.setCenter(place.geometry.location);

        // 既存のマーカーがあれば削除
        if (currentMarker) {
          currentMarker.setMap(null);
        }

        // 新しいマーカーを設置
        currentMarker = new google.maps.Marker({
          map: map,
          position: place.geometry.location,
        });

        map.setZoom(15);
      }
    });

    // geocoding
    input.addEventListener("change", function (e) {
      if (!autocomplete.getPlace()) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: e.target.value }, (results, status) => {
          if (status === "OK") {
            const location = results[0].geometry.location;
            map.setCenter(location);

            // 既存のマーカーがあれば削除
            if (currentMarker) {
              currentMarker.setMap(null);
            }

            // 新しいマーカーを設置
            currentMarker = new google.maps.Marker({
              map: map,
              position: location,
            });
            map.setZoom(15);
          }
        });
      }
    });
  } catch (error) {
    console.error("Map initialization error:", error);
  }
};

function validateForm() {
  let isValid = true;
  const formGroups = {
    image: document.getElementById("imageUpload"),
    title: document.getElementById("eventTitle").closest(".form-group"),
    dateTime: document.querySelector(".datetime-inputs").closest(".form-group"),
    location: document.getElementById("eventLocation").closest(".form-group"),
    capacity: document.getElementById("eventCapacity").closest(".form-group"),
    category: document.querySelector(".category-section"),
    description: document.getElementById("eventDetails").closest(".form-group"),
  };

  // 画像のバリデーション
  if (!document.querySelector("#imagePreview img")) {
    showError(formGroups.image, "Please upload an event image");
    isValid = false;
  }

  // タイトルのバリデーション
  if (!document.getElementById("eventTitle").value.trim()) {
    showError(formGroups.title, "Please enter event title");
    isValid = false;
  }

  // 日付と時間のバリデーション
  if (!document.getElementById("startDate").value) {
    showError(formGroups.dateTime, "Please select event date and time");
    isValid = false;
  }

  // 場所のバリデーション
  if (!document.getElementById("eventLocation").value.trim()) {
    showError(formGroups.location, "Please enter event location");
    isValid = false;
  }

  // 定員のバリデーション
  if (!document.getElementById("eventCapacity").value) {
    showError(formGroups.capacity, "Please enter event capacity");
    isValid = false;
  }

  // カテゴリーのバリデーション
  if (!document.getElementById("selectedCategory").value) {
    showError(formGroups.category, "Please select at least one category");
    isValid = false;
  }

  // イベント詳細のバリデーション
  const eventDetailsContent = tinymce.get("eventDetails").getContent();
  if (!eventDetailsContent.trim()) {
    showError(formGroups.description, "Please enter event description");
    isValid = false;
  }

  // 入力時のエラー解除のイベントリスナーを設定
  Object.values(formGroups).forEach((formGroup) => {
    const inputs = formGroup.querySelectorAll("input, select, textarea");

    // カテゴリーボタンのクリックイベントを監視
    if (formGroup.classList.contains("category-section")) {
      const categoryButtons = formGroup.querySelectorAll(".category-btn");
      categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
          clearError(formGroup);
        });
      });
    }

    // TinyMCEエディタの変更を監視
    if (formGroup.querySelector("#eventDetails")) {
      tinymce.get("eventDetails").on("input", () => {
        clearError(formGroup);
      });
    }

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        clearError(formGroup);
      });
    });
  });

  return isValid;
}

// エラー表示関数
function showError(formGroup, message) {
  // 既存のエラー状態をリセット
  formGroup.classList.remove("error");

  // 既存のエラーメッセージを削除
  const existingError = formGroup.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // 新しいエラーメッセージを追加
  formGroup.classList.add("error");
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  formGroup.appendChild(errorDiv);
}

// エラークリア関数
function clearError(formGroup) {
  formGroup.classList.remove("error");
  const errorMessage = formGroup.querySelector(".error-message");
  if (errorMessage) {
    errorMessage.remove();
  }
}

// ドラフト保存用の簡易バリデーション
function validateDraftForm() {
  // タイトルだけは必須とする
  const eventTitle = document.getElementById("eventTitle").value;
  if (!eventTitle.trim()) {
    showValidationMessage(
      document.getElementById("eventTitle"),
      "Title is required even for draft"
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
    return false;
  }
  return true;
}

// タイトル入力フィールドのエラークリアを設定
function initializeErrorClear() {
  const titleInput = document.getElementById("eventTitle");
  titleInput.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });
}

// フォームデータを収集する関数
function collectFormData() {
  try {
    const imagePreview = document.querySelector("#imagePreview img");
    const eventImage = imagePreview ? imagePreview.src : null;
    const userId = auth.currentUser.uid;
    const eventTitle = document.getElementById("eventTitle").value;

    // 日付と時間の処理を改善
    const startDate = document.getElementById("startDate").value;
    const startTime = document.getElementById("startTime").value || "00:00";
    const endTime = document.getElementById("endTime").value || "23:59";

    // 日時文字列を作成
    const eventStartDate = `${startDate}T${startTime}:00`;
    const eventEndDate = `${startDate}T${endTime}:00`;

    const eventLocation = document.getElementById("eventLocation").value || "";
    const type = "event";
    const eventCapacity =
      parseInt(document.getElementById("eventCapacity").value, 10) || 0;
    const eventDetails = tinymce.get("eventDetails")
      ? tinymce.get("eventDetails").getContent()
      : "";
    const selectedCategory =
      document
        .getElementById("selectedCategory")
        .value.split(",")
        .filter((category) => category.trim() !== "") || [];

    return {
      eventImage,
      eventTitle,
      eventStartDate, // ISO形式の文字列として渡す
      eventEndDate, // ISO形式の文字列として渡す
      eventLocation,
      eventCapacity,
      selectedCategory,
      eventDetails,
      type,
      userId,
    };
  } catch (error) {
    console.error("Error in collectFormData:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Starting initialization...");

  if (TESTING) {
    console.log("Test mode - skipping auth check");
    initializeEventPage();
    return;
  }

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("No user found - redirecting to login");
      window.location.href =
        "../../../authentication-Francisco/html/log-in.html";
    } else {
      console.log("User authenticated, initializing page...");
      initializeEventPage();

      // ユーザー情報の表示をコメントアウト
      /* 
      const userInfo = document.getElementById("userInfo");
      if (userInfo) {
        userInfo.textContent = `Test to make sure auth is working, your User ID: ${user.uid}, Email: ${user.email}, Display Name: ${user.username}`;
        userInfo.style.fontSize = ".8rem";
        userInfo.style.color = "blue";
        userInfo.style.marginTop = "10px";
        userInfo.style.marginBottom = "10px";
      }
      */
    }
  });

  // Google Maps APIの読み込み
  loadGoogleMapsAPI()
    .then(() => {
      // Google Maps APIが正常に読み込まれた後の処理
      console.log("Google Maps API loaded successfully");
    })
    .catch((error) => {
      console.error("Error loading Google Maps API:", error);
    });

  // クリーンアップ
  window.addEventListener("unload", () => {
    unsubscribe();
  });
});

// Google Maps APIの読み込み関数
function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    try {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      // グローバルスコープにコールバック関数を設定
      window.initMap = function () {
        try {
          const defaultLocation = { lat: 49.2827, lng: -123.1207 };
          const map = new google.maps.Map(document.getElementById("map"), {
            center: defaultLocation,
            zoom: 12,
            language: "en",
            mapId: MAP_ID,
          });

          // 位置情報の取得と地図の設定
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const currentLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                map.setCenter(currentLocation);
                new google.maps.Marker({
                  map: map,
                  position: currentLocation,
                  title: "You are here",
                });
              },
              () => map.setCenter(defaultLocation)
            );
          }

          // Autocomplete機能の設定
          const input = document.getElementById("eventLocation");
          const autocomplete = new google.maps.places.Autocomplete(input);
          let currentMarker = null;

          // 場所が選択されたときの処理
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              updateMapMarker(map, place.geometry.location, currentMarker);
              currentMarker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
              });
            }
          });

          resolve();
        } catch (error) {
          console.error("Map initialization error:", error);
          reject(error);
        }
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error("Error loading Google Maps API:", error);
      reject(error);
    }
  });
}

// マーカーの更新を行う補助関数
function updateMapMarker(map, location, currentMarker) {
  if (currentMarker) {
    currentMarker.setMap(null);
  }
  map.setCenter(location);
  map.setZoom(15);
}

// プログレスバーを更新する関数
function updateProgressBar(step) {
  const steps = document.querySelectorAll(".step");
  steps.forEach((s) => {
    s.classList.remove("active", "completed");
  });

  if (step === "review") {
    steps[0].classList.add("completed");
    steps[1].classList.add("active");
  } else if (step === "create") {
    steps[0].classList.add("active");
  }
}

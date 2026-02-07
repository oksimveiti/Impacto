import { GOOGLE_MAPS_API_KEY, MAP_ID } from "../../../../config/config.js"; //get API Key
import { saveEventPetitionToFirestore } from "../backend/firestore-event-petition.js";
import { initializeTinyMCE } from "./tinyMCE-config.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "../../../../config/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
            const eventId = await saveEventPetitionToFirestore(formData);
            console.log("Saved draft with ID:", eventId);
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
              const eventId = await saveEventPetitionToFirestore(formData);
              sessionStorage.setItem("createdEventId", eventId);
              window.location.href =
                "../../../create-event-Naomi/html/event-petition-completion.html";
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

  // タイトルのバリデーション
  const titleInput = document.getElementById("eventTitle");
  if (!titleInput.value.trim()) {
    showValidationMessage(titleInput, "Please enter a title");
    isValid = false;
  }

  // イベント日時のバリデーション
  const eventStartDate = document.getElementById("event_startDate");
  const eventStartTime = document.getElementById("event_startTime");
  const eventEndTime = document.getElementById("event_endTime");
  const eventLocationInput = document.getElementById("eventLocation");
  const eventCapacity = document.getElementById("eventCapacity");
  const petitionStartDate = document.getElementById("petition_startDate");
  const petitionEndDate = document.getElementById("petition_endDate");
  const eventImage = document.getElementById("eventImage");

  if (!eventImage.value) {
    showValidationMessage(eventImage, "Please upload an image");
    isValid = false;
  }

  if (!eventStartDate.value) {
    showValidationMessage(eventStartDate, "Please select a start date");
    isValid = false;
  }

  if (!eventLocationInput.value) {
    showValidationMessage(eventLocationInput, "Please enter a location");
    isValid = false;
  }

  if (!eventCapacity.value) {
    showValidationMessage(eventCapacity, "Please enter a capacity");
    isValid = false;
  }

  if (!petitionStartDate.value || !petitionEndDate.value) {
    showValidationMessage(
      petitionStartDate,
      "Please select a start & end date"
    );
    isValid = false;
  }

  // 請願情報のバリデーション
  const petitionTarget = document.getElementById("petitionTarget");
  if (!petitionTarget.value || petitionTarget.value < 1) {
    showValidationMessage(
      petitionTarget,
      "Please enter a valid petition target"
    );
    isValid = false;
  }

  // カテゴリーのバリデーション
  const selectedCategories = document.querySelectorAll(
    ".category-btn.selected"
  );
  if (selectedCategories.length === 0) {
    const categorySection = document.querySelector(".category-section");
    showValidationMessage(
      categorySection,
      "Please select at least one category"
    );
    isValid = false;
  }

  // 説明のバリデーション
  // const eventDetails = tinymce.get("eventDetails");
  // if (!eventDetails || !eventDetails.getContent().trim()) {
  //   showValidationMessage(
  //     document.getElementById("eventDetails"),
  //     "Please enter event details"
  //   );
  //   isValid = false;
  // }

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
  const imageInput = document.getElementById("eventImage");
  imageInput.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  const titleInput = document.getElementById("eventTitle");
  titleInput.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  const eventLocationInput = document.getElementById("eventLocation");
  eventLocationInput.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  const eventStartDate = document.getElementById("event_startDate");
  eventStartDate.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  const capacityInput = document.getElementById("eventCapacity");
  capacityInput.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  const petitionStartDate = document.getElementById("petition_startDate");
  petitionStartDate.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  const petitionTarget = document.getElementById("petitionTarget");
  petitionTarget.addEventListener("input", function () {
    const formGroup = this.closest(".form-group");
    if (formGroup) {
      clearError(formGroup);
    }
  });

  // カテゴリーのエラークリア
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const formGroup = this.closest(".form-group");
      if (formGroup) {
        clearError(formGroup);
      }
    });
  });

  // TinyMCEエディタのエラークリア（修正版）
  tinymce.on("AddEditor", function (e) {
    e.editor.on("input", function (e) {
      const editorElement = e.target.getElement(); // エディタのDOM要素を取得
      const formGroup = editorElement.closest(".form-group");
      if (formGroup) {
        const errorElement = formGroup.querySelector(".error-message");
        if (errorElement) {
          errorElement.style.display = "none";
        }
        formGroup.classList.remove("error");
      }
    });
  });
}

// フォームデータを収集する関数
function collectFormData() {
  try {
    const imagePreview = document.querySelector("#imagePreview img");
    const eventImage = imagePreview ? imagePreview.src : null;
    const userId = auth.currentUser.uid;

    // イベント情報
    const eventStartDate = document.getElementById("event_startDate").value;
    const eventStartTime = document.getElementById("event_startTime").value;
    const eventEndTime = document.getElementById("event_endTime").value;

    // 請願情報
    const petitionStartDate =
      document.getElementById("petition_startDate").value;
    const petitionStartTime =
      document.getElementById("petition_startTime").value;
    const petitionEndDate = document.getElementById("petition_endDate").value;
    const petitionEndTime = document.getElementById("petition_endTime").value;
    const petitionTarget = document.getElementById("petitionTarget").value;
    const eventCapacity = document.getElementById("eventCapacity").value;

    return {
      eventImage,
      eventTitle: document.getElementById("eventTitle").value,
      // イベント日時
      eventStartDate,
      eventStartTime,
      eventEndTime,
      // 請願日時
      petitionStartDate,
      petitionStartTime,
      petitionEndDate,
      petitionEndTime,
      petitionTarget,
      eventCapacity,
      eventLocation: document.getElementById("eventLocation").value,
      selectedCategory: Array.from(
        document.querySelectorAll(".category-btn.selected")
      ).map((btn) => btn.querySelector(".label").textContent),
      eventDetails: tinymce.get("eventDetails").getContent(),
      type: "petition",
      userId,
    };
  } catch (error) {
    console.error("Error in collectFormData:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", function () {
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

      // // ユーザー情報の表示
      // const userInfo = document.getElementById("userInfo");
      // userInfo.textContent = `Test to make sure auth is working, your User ID: ${user.uid}, Email: ${user.email}, Display Name: ${user.username}`;
      // userInfo.style.fontSize = ".8rem";
      // userInfo.style.color = "blue";
      // userInfo.style.marginTop = "10px";
      // userInfo.style.marginBottom = "10px";
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

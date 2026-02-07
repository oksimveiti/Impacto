import { GOOGLE_MAPS_API_KEY, MAP_ID } from "../../../../config/config.js"; //get API Key
import { savePetitionToFirestore } from "../backend/firestore-petition.js";
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
function initializePetitionPage() {
  console.log("Initializing event page...");

  // フォーム要素の取得
  const imageInput = document.getElementById("eventImage");
  const titleInput = document.getElementById("eventTitle");
  const petitionStartDate = document.getElementById("petition_startDate");
  const petitionStartTime = document.getElementById("petition_startTime");
  const petitionEndTime = document.getElementById("petition_endTime");
  const petitionTarget = document.getElementById("petitionTarget");
  const eventForm = document.getElementById("eventForm");
  const clearEventButton = document.getElementById("clearEventButton");

  // エラークリアの初期化
  initializeErrorClear();

  // カテゴリーボタンの初期化
  initializeCategoryButtons();

  // 画像プレビューの処理
  initializeImagePreview(imageInput);

  // TinyMCEの初期化
  setTimeout(() => {
    initializeTinyMCE();
    // TinyMCE初期化後にエラークリアの設定を追加
    setTimeout(setupTinyMCEErrorClear, 100);
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
          formData.status = "draft";
          try {
            const petitionId = await savePetitionToFirestore(formData);
            sessionStorage.setItem("createdEventId", petitionId);
            window.location.href =
              "../../../create-event-Naomi/html/draft-saved.html";
          } catch (error) {
            console.error("Failed to save draft:", error);
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
              const eventId = await savePetitionToFirestore(formData);
              sessionStorage.setItem("createdEventId", eventId);
              window.location.href =
                "../../../create-event-Naomi/html/petition-completion.html";
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

function validateForm() {
  let isValid = true;

  // 画像のバリデーション
  const imagePreview = document.querySelector("#imagePreview img");
  if (!imagePreview) {
    const imageUpload = document.getElementById("imageUpload");
    showValidationMessage(imageUpload, "Please upload an image");
    isValid = false;
  }

  // タイトルのバリデーション
  const titleInput = document.getElementById("eventTitle");
  if (!titleInput.value.trim()) {
    showValidationMessage(titleInput, "Please enter a title");
    isValid = false;
  }

  // 請願期間のバリデーション
  const petitionStartDate = document.getElementById("petition_startDate");
  const petitionStartTime = document.getElementById("petition_startTime");
  const petitionEndTime = document.getElementById("petition_endTime");

  if (!petitionStartDate.value) {
    showValidationMessage(petitionStartDate, "Please select a start date");
    isValid = false;
  }

  // 請願目標のバリデーション
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
  const eventDetails = tinymce.get("eventDetails");
  if (!eventDetails || !eventDetails.getContent().trim()) {
    showValidationMessage(
      document.getElementById("eventDetails"),
      "Please enter event details"
    );
    isValid = false;
  }

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

// エラークリア関数
function initializeErrorClear() {
  // 画像アップロードのエラークリア
  const imageInput = document.getElementById("eventImage");
  imageInput.addEventListener("change", function () {
    clearValidationError(document.getElementById("imageUpload"));
  });

  // タイトル入力のエラークリア
  const titleInput = document.getElementById("eventTitle");
  titleInput.addEventListener("input", function () {
    clearValidationError(this.closest(".form-group"));
  });

  // 日付と時間のエラークリア
  const dateTimeInputs = [
    "petition_startDate",
    "petition_startTime",
    "petition_endTime",
  ];
  dateTimeInputs.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("change", function () {
      clearValidationError(this.closest(".form-group"));
    });
  });

  // 請願目標のエラークリア
  const targetInput = document.getElementById("petitionTarget");
  targetInput.addEventListener("input", function () {
    clearValidationError(this.closest(".form-group"));
  });

  // カテゴリーのエラークリア
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      clearValidationError(document.querySelector(".category-section"));
    });
  });

  // TinyMCEエディタのエラークリア（修正版）
  tinymce.on("AddEditor", function (e) {
    e.editor.on("input", function () {
      clearValidationError(
        document.getElementById("eventDetails").closest(".form-group")
      );
    });
  });

  // または、エディタが既に初期化されている場合は直接設定
  if (tinymce.get("eventDetails")) {
    tinymce.get("eventDetails").on("input", function () {
      clearValidationError(
        document.getElementById("eventDetails").closest(".form-group")
      );
    });
  }
}

function clearValidationError(element) {
  if (!element) return;

  // エラークラスを削除
  element.classList.remove("error");

  // エラーメッセージを削除
  const errorMessage = element.querySelector(".error-message");
  if (errorMessage) {
    errorMessage.remove();
  }
}

// TinyMCE初期化後にエラークリアを設定するヘルパー関数を追加
function setupTinyMCEErrorClear() {
  const editor = tinymce.get("eventDetails");
  if (editor) {
    editor.on("input keyup paste change", function () {
      clearValidationError(
        document.getElementById("eventDetails").closest(".form-group")
      );
    });
  }
}

// フォームデータを収集する関数
function collectFormData() {
  try {
    const imagePreview = document.querySelector("#imagePreview img");
    const image = imagePreview ? imagePreview.src : null;
    const userId = auth.currentUser.uid;
    const startDate = document.getElementById("petition_startDate").value;
    const startTime = document.getElementById("petition_startTime").value;
    const endTime = document.getElementById("petition_endTime").value;

    return {
      eventImage: image,
      eventTitle: document.getElementById("eventTitle").value,
      petition_start_date: document.getElementById("petition_startDate").value,
      petition_start_time: document.getElementById("petition_startTime").value,
      petition_end_date: document.getElementById("petition_endDate").value,
      petition_end_time: document.getElementById("petition_endTime").value,
      eventStartDate: startDate,
      eventStartTime: startTime,
      eventEndTime: endTime,
      petitionTarget: document.getElementById("petitionTarget").value,
      selectedCategory: Array.from(
        document.querySelectorAll(".category-btn.selected")
      ).map((btn) => btn.querySelector(".label").textContent),
      eventDetails: tinymce.get("eventDetails").getContent(),
      type: "petition",
      userId,
      latitude: null,
      longitude: null,
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
    initializePetitionPage();
    return;
  }

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log("No user found - redirecting to login");
      window.location.href =
        "../../../authentication-Francisco/html/log-in.html";
    } else {
      console.log("User authenticated, initializing page...");
      initializePetitionPage();

      // // ユーザー情報の表示
      // const userInfo = document.getElementById("userInfo");
      // userInfo.textContent = `Test to make sure auth is working, your User ID: ${user.uid}, Email: ${user.email}, Display Name: ${user.username}`;
      // userInfo.style.fontSize = ".8rem";
      // userInfo.style.color = "blue";
      // userInfo.style.marginTop = "10px";
      // userInfo.style.marginBottom = "10px";
    }
  });

  // クリーンアップ
  window.addEventListener("unload", () => {
    unsubscribe();
  });
});

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

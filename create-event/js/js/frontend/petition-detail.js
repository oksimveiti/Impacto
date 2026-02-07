import {
  getPetitionDetails,
  addParticipant,
  checkParticipantStatus,
  checkFavouriteStatus,
  toggleFavourite,
  checkSupportStatus,
  toggleSupport,
  checkAttendStatus,
  toggleAttend,
} from "../backend/firestore-petition-detail.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "../../../../config/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  doc,
  getDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initializeSaveNotification } from "./save-event.js";

// Firebase初期化のデバッグ
console.log("Starting Firebase initialization...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("Firebase initialized, auth:", auth);

// テスト用フラグ
const TESTING = false;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded fired");

  // onAuthStateChangedのリスナーを設定
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed triggered");
    console.log("Current user:", user);

    if (!user && !TESTING) {
      console.log("No user found - redirecting to login");
      window.location.href =
        "../../../authentication-Francisco/html/log-in.html";
      return;
    }

    if (user) {
      // const userInfo = document.getElementById("userInfo");
      // if (userInfo) {
      //   userInfo.textContent = `Test to make sure auth is working, your User ID: ${user.uid}, Email: ${user.email}, Display Name: ${user.displayName}`;
      //   userInfo.style.fontSize = ".8rem";
      //   userInfo.style.color = "hotpink";
      //   userInfo.style.marginTop = "10px";
      //   userInfo.style.marginBottom = "10px";
      // }

      console.log("Auth state changed:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });

      initializePetitionDetailPage();
      renewRecentlyViewed(eventId); //Yun added
      console.log("Petition detail page initialized");
    }
  });

  console.log("Auth listener set up");

  // ページがアンロードされる時にリスナーを解除
  window.addEventListener("unload", () => {
    unsubscribe();
  });

  initializeSaveNotification();
});

function initializePetitionDetailPage() {
  console.log("Initializing petition detail page...");
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  if (!eventId) {
    console.error("No event ID provided in URL");
    return;
  }

  // 請願詳細を取得
  getPetitionDetails(eventId);

  // 必要なボタンの取得と存在チェック
  const favouriteButton = document.getElementById("favouriteButton");
  const supportButton = document.getElementById("supportButton");

  // お気に入りボタンの初期状態を設定
  async function initializeFavouriteButton() {
    if (!auth.currentUser || !favouriteButton) return;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("id");
    const isFavourite = await checkFavouriteStatus(
      auth.currentUser.uid,
      eventId
    );

    favouriteButton.classList.toggle("active", isFavourite);
  }

  // サポートボタンの初期状態を設定
  async function initializeSupportButton() {
    if (!auth.currentUser || !supportButton) return;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("id");
    const isSupporting = await checkSupportStatus(
      auth.currentUser.uid,
      eventId
    );

    supportButton.classList.toggle("active", isSupporting);
    supportButton.innerText = isSupporting ? "Supporting" : "Support";
  }

  // お気に入りボタンの初期化
  if (favouriteButton) {
    favouriteButton.addEventListener("click", async () => {
      try {
        if (!auth.currentUser) {
          alert("Please login to add to favourites");
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get("id");
        const isFavourite = await toggleFavourite(
          auth.currentUser.uid,
          eventId
        );

        favouriteButton.classList.toggle("active", isFavourite);
      } catch (error) {
        console.error("Error toggling favourite:", error);
        alert("Failed to update favourites. Please try again.");
      }
    });
  }

  // サポートボタンの初期化
  if (supportButton) {
    supportButton.addEventListener("click", async () => {
      try {
        if (!auth.currentUser) {
          alert("Please login to support this event");
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get("id");
        const isCurrentlySupporting =
          supportButton.classList.contains("active");

        if (isCurrentlySupporting) {
          // サポート解除の確認ポップアップを表示
          showConfirmationPopup(
            "Cancel Support?",
            "Are you sure you want to cancel your support for this petition?",
            async () => {
              const isSupporting = await toggleSupport(
                auth.currentUser.uid,
                eventId
              );
              supportButton.classList.toggle("active", isSupporting);
              supportButton.innerText = isSupporting ? "Supporting" : "Support";
            }
          );
        } else {
          const isSupporting = await toggleSupport(
            auth.currentUser.uid,
            eventId
          );
          supportButton.classList.toggle("active", isSupporting);
          supportButton.innerText = isSupporting ? "Supporting" : "Support";
          if (isSupporting) {
            window.location.href = `./you-are-in-petition.html?id=${eventId}`;
          }
        }
      } catch (error) {
        console.error("Error toggling support:", error);
        alert("Failed to update support status. Please try again.");
      }
    });
  }

  // 初期状態の設定
  initializeFavouriteButton();
  initializeSupportButton();
  initializeShareButton();
}

function initializeShareButton() {
  const shareButton = document.getElementById("shareButton");
  const shareOverlay = document.getElementById("shareOverlay");

  // シェアボタンのクリックイベント
  shareButton.addEventListener("click", (e) => {
    e.stopPropagation();
    shareOverlay.classList.toggle("active");
  });

  // 画面のどこかをクリックしたらオーバーレイを閉じる
  document.addEventListener("click", (e) => {
    if (!shareOverlay.contains(e.target) && !shareButton.contains(e.target)) {
      shareOverlay.classList.remove("active");
    }
  });

  // メールでシェア
  const emailButton = shareOverlay.querySelector(".email");
  emailButton.addEventListener("click", () => {
    const url = window.location.href;
    const title = document.getElementById("eventTitle").textContent;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(url)}`;
    window.open(mailtoLink);
  });

  // Facebookでシェア
  const facebookButton = shareOverlay.querySelector(".facebook");
  facebookButton.addEventListener("click", () => {
    const url = window.location.href;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(shareUrl, "_blank");
  });

  // リンクをコピー
  const copyButton = shareOverlay.querySelector(".copy-link");
  copyButton.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showNotification("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  });
}

// 通知を表示する関数
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  // アニメーションのために少し待ってからクラスを追加
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // アニメーション終了後に要素を削除
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// ポップアップを表示する関数
function showConfirmationPopup(title, message, onConfirm) {
  const popupOverlay = document.createElement("div");
  popupOverlay.className = "popup-overlay";

  const popupContent = document.createElement("div");
  popupContent.className = "popup-content";

  popupContent.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
    <div class="popup-buttons">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Confirm</button>
    </div>
  `;

  popupOverlay.appendChild(popupContent);
  document.body.appendChild(popupOverlay);

  requestAnimationFrame(() => {
    popupOverlay.style.display = "flex";
  });

  const confirmBtn = popupContent.querySelector(".confirm-btn");
  const cancelBtn = popupContent.querySelector(".cancel-btn");

  confirmBtn.addEventListener("click", async () => {
    await onConfirm();
    popupOverlay.remove();
    // ページをリロード
    window.location.reload();
  });

  cancelBtn.addEventListener("click", () => {
    popupOverlay.remove();
  });

  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) {
      popupOverlay.remove();
    }
  });
}

// ボタンの表示/非表示を制御する関数
function toggleButtons(currentUserId, organizerId) {
  const supportButton = document.getElementById("supportButton");
  const attendButton = document.getElementById("attendButton");

  if (currentUserId === organizerId) {
    // 主催者の場合はボタンを非表示
    supportButton.style.display = "none";
    attendButton.style.display = "none";
  } else {
    // 主催者でない場合はボタンを表示
    supportButton.style.display = "block";
    attendButton.style.display = "block";
  }
}

// イベントデータを取得して表示する関数
async function displayEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  if (!eventId) {
    console.error("Event ID not found in URL");
    return;
  }

  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();

      // モバイルタイトルの表示
      const mobileTitle = document.getElementById("mobileEventTitle");
      if (mobileTitle) {
        mobileTitle.textContent = eventData.title;
      }

      // 通常のタイトル表示
      const eventTitle = document.getElementById("eventTitle");
      if (eventTitle) {
        eventTitle.textContent = eventData.title;
      }

      // ログイン状態を監視
      onAuthStateChanged(auth, (user) => {
        if (user) {
          toggleButtons(user.uid, eventData.organizer_id);
        }
      });
    } else {
      console.error("Event not found");
    }
  } catch (error) {
    console.error("Error getting event details:", error);
  }
}

// ページ読み込み時に実行
document.addEventListener("DOMContentLoaded", displayEventDetails);

import {
  getEventDetails,
  addParticipant,
  checkParticipantStatus,
  checkFavouriteStatus,
  toggleFavourite,
  checkSupportStatus,
  toggleSupport,
  checkAttendStatus,
  toggleAttend,
} from "../backend/firestore-event-detail.js";
//*****Developmentブランチに反映されていなかった場所
import { renewRecentlyViewed } from "../../../../home/js/frontend/recently-viewed.js";
//*******************************
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

      initializeEventDetailPage();
      console.log("Event detail page initialized");
    }
  });

  console.log("Auth listener set up");

  // ページがアンロードされる時にリスナーを解除
  window.addEventListener("unload", () => {
    unsubscribe();
  });

  initializeSaveNotification();
});

function initializeEventDetailPage() {
  console.log("Initializing event detail page...");
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  if (!eventId) {
    console.error("No event ID provided in URL");
    return;
  }

  // 最近閲覧したイベントを更新
  renewRecentlyViewed(eventId);

  // supportButtonを非表示にする
  const supportButton = document.getElementById("supportButton");
  if (supportButton) {
    supportButton.style.display = "none";
  }

  // イベント詳細を取得
  getEventDetails(eventId);

  const attendButton = document.getElementById("attendButton");
  const favouriteButton = document.getElementById("favouriteButton");
  const auth = getAuth();

  // Attendボタンの初期状態を設定
  async function initializeAttendButton() {
    if (!auth.currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("id");
    const isAttending = await checkAttendStatus(auth.currentUser.uid, eventId);

    attendButton.classList.toggle("active", isAttending);
    attendButton.innerText = isAttending ? "Attending" : "Attend";
  }

  // Attendボタンのクリックイベント
  attendButton.addEventListener("click", async () => {
    try {
      if (!auth.currentUser) {
        alert("Please login to attend this event");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get("id");
      const userId = auth.currentUser.uid;
      const isCurrentlyAttending = attendButton.classList.contains("active");

      // イベントの詳細情報を取得
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      const eventData = eventDoc.data();

      // 現在の参加者リストをチェック
      const currentParticipants = eventData.participants || [];
      const isNewParticipant = !currentParticipants.includes(userId);

      if (isCurrentlyAttending) {
        // 参加取り消しの確認ポップアップを表示
        showConfirmationPopup(
          "Cancel Attendance?",
          "Are you sure you want to cancel your attendance for this event?",
          async () => {
            try {
              const isAttending = await toggleAttend(userId, eventId);
              attendButton.classList.toggle("active", isAttending);
              attendButton.innerText = isAttending ? "Attending" : "Attend";
              window.location.reload();
            } catch (error) {
              console.error("Error in confirmation callback:", error);
            }
          }
        );
      } else {
        // 新規参加の場合は直接処理
        const isAttending = await toggleAttend(userId, eventId);
        attendButton.classList.toggle("active", isAttending);
        attendButton.innerText = isAttending ? "Attending" : "Attend";

        if (isAttending && isNewParticipant) {
          const params = new URLSearchParams({
            title: eventData.title,
            start: eventData.event_start_date_time.toDate().toISOString(),
            end: eventData.event_end_date_time.toDate().toISOString(),
            address: eventData.address,
          });

          window.location.href = `../html/you-are-in-event.html?${params.toString()}`;
        }
      }
    } catch (error) {
      console.error("Error attending event:", error);
      alert("Failed to update attend status. Please try again.");
    }
  });

  // 初期化時にAttend状態をチェック
  initializeAttendButton();

  // お気に入りボタンの初期状態を設定
  async function initializeFavouriteButton() {
    if (!auth.currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("id");
    const isFavourite = await checkFavouriteStatus(
      auth.currentUser.uid,
      eventId
    );

    favouriteButton.classList.toggle("active", isFavourite);
  }

  // お気に入りボタンのクリックイベント
  favouriteButton.addEventListener("click", async () => {
    try {
      if (!auth.currentUser) {
        alert("Please login to add to favourites");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get("id");
      const isFavourite = await toggleFavourite(auth.currentUser.uid, eventId);

      favouriteButton.classList.toggle("active", isFavourite);
    } catch (error) {
      console.error("Error toggling favourite:", error);
      alert("Failed to update favourites. Please try again.");
    }
  });

  // 初期化時にお気に入り状態をチェック
  initializeFavouriteButton();

  // サポートボタンの初期状態を設定
  async function initializeSupportButton() {
    if (!auth.currentUser) return;

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("id");
    const isSupporting = await checkSupportStatus(
      auth.currentUser.uid,
      eventId
    );

    supportButton.classList.toggle("active", isSupporting);
    supportButton.innerText = isSupporting ? "Supporting" : "Support";
  }

  // サポートボタンのクリックイベント
  supportButton.addEventListener("click", async () => {
    try {
      if (!auth.currentUser) {
        alert("Please login to support this event");
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get("id");
      const isSupporting = await toggleSupport(auth.currentUser.uid, eventId);

      supportButton.classList.toggle("active", isSupporting);
      supportButton.innerText = isSupporting ? "Supporting" : "Support";
    } catch (error) {
      console.error("Error toggling support:", error);
      alert("Failed to update support status. Please try again.");
    }
  });

  // 初期化時にサポート状態をチェック
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
  popupOverlay.style.display = "flex";
  popupOverlay.style.position = "fixed";
  popupOverlay.style.top = "0";
  popupOverlay.style.left = "0";
  popupOverlay.style.width = "100%";
  popupOverlay.style.height = "100%";
  popupOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  popupOverlay.style.justifyContent = "center";
  popupOverlay.style.alignItems = "center";
  popupOverlay.style.zIndex = "1000";

  const popupContent = document.createElement("div");
  popupContent.className = "popup-content";
  popupContent.style.backgroundColor = "white";
  popupContent.style.padding = "30px";
  popupContent.style.borderRadius = "8px";
  popupContent.style.maxWidth = "400px";
  popupContent.style.width = "90%";

  popupContent.innerHTML = `
    <h3 style="color: var(--MainBlue); margin-bottom: 15px;">${title}</h3>
    <p style="margin-bottom: 20px;">${message}</p>
    <div style="display: flex; justify-content: center; gap: 15px;">
      <button class="cancel-btn" style="padding: 8px 20px; border-radius: 4px; border: 1px solid var(--MainBlue); background: transparent; color: var(--MainBlue); cursor: pointer;">Cancel</button>
      <button class="confirm-btn" style="padding: 8px 20px; border-radius: 4px; background: var(--MainBlue); color: white; border: none; cursor: pointer;">Confirm</button>
    </div>
  `;

  popupOverlay.appendChild(popupContent);
  document.body.appendChild(popupOverlay);

  return new Promise((resolve) => {
    const confirmBtn = popupContent.querySelector(".confirm-btn");
    const cancelBtn = popupContent.querySelector(".cancel-btn");

    confirmBtn.addEventListener("click", async () => {
      await onConfirm();
      popupOverlay.remove();
      resolve(true);
    });

    cancelBtn.addEventListener("click", () => {
      popupOverlay.remove();
      resolve(false);
    });

    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.remove();
        resolve(false);
      }
    });
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

      // ログイン状態を監視
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // ユーザーがログインしている場合、ボタンの表示を制御
          toggleButtons(user.uid, eventData.organizer_id);
        }
      });

      // モバイルタイトルの表示
      const mobileTitle = document.getElementById("mobileEventTitle");
      if (mobileTitle) {
        mobileTitle.textContent = eventData.title;
      }

      // ... 他のイベント詳細の表示処理 ...
    } else {
      console.error("Event not found");
    }
  } catch (error) {
    console.error("Error getting event details:", error);
  }
}

// ページ読み込み時に実行
document.addEventListener("DOMContentLoaded", displayEventDetails);

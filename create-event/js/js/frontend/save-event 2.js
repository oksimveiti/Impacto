import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 通知を表示する関数
function showSaveNotification(message) {
  // 既存の通知があれば削除
  const existingNotification = document.querySelector(".save-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = "save-notification";
  notification.style.position = "fixed";
  notification.style.top = "100px";
  notification.style.left = "50%";
  notification.style.transform = "translateX(-50%)";
  notification.style.backgroundColor = "var(--MainBlue)";
  notification.style.color = "white";
  notification.style.padding = "12px 24px";
  notification.style.borderRadius = "8px";
  notification.style.zIndex = "1000";
  notification.style.opacity = "0";
  notification.style.transition = "opacity 0.3s ease";
  notification.textContent = message;

  document.body.appendChild(notification);

  // フェードイン
  setTimeout(() => {
    notification.style.opacity = "1";
  }, 10);

  // 3秒後にフェードアウト
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Firestoreでイベントが保存されているか確認する関数
async function checkEventSavedStatus(userId, eventId) {
  const db = getFirestore();
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const savedEvents = userData.saved_events || [];
    return savedEvents.includes(eventId);
  }
  return false;
}

// お気に入りボタンの状態を監視・更新する関数
export function initializeSaveNotification() {
  const favouriteButton = document.getElementById("favouriteButton");
  const auth = getAuth();

  if (favouriteButton) {
    favouriteButton.addEventListener("click", async () => {
      if (!auth.currentUser) return;

      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get("id");

      // トグル処理の完了を待つ
      setTimeout(async () => {
        try {
          // Firestoreで実際の状態を確認
          const isSaved = await checkEventSavedStatus(
            auth.currentUser.uid,
            eventId
          );

          // 保存状態に応じてメッセージを表示
          const message = isSaved
            ? "You unsaved this event"
            : "You saved this event";
          showSaveNotification(message);
        } catch (error) {
          console.error("Error checking save status:", error);
        }
      }, 100);
    });
  }
}

import { getPetitionDetails } from "../backend/firestore-petition-detail.js";
import { firebaseConfig } from "../../../../config/config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const petitionId = urlParams.get("id");

  if (petitionId) {
    try {
      // 直接Firestoreからデータを取得
      const eventDoc = await getDoc(doc(db, "events", petitionId));
      const petitionData = eventDoc.data();
      console.log("Direct petition data:", petitionData);

      if (!petitionData) {
        console.error("No petition data found");
        return;
      }

      // 請願のタイトルを設定
      const titleElement = document.getElementById("petitionTitle");
      if (titleElement) {
        titleElement.textContent = petitionData.title || "No Title";
      }

      // 日時を設定
      const startDateTime = formatDateTime(
        petitionData.petition_start_date_time?.toDate() || new Date(),
        petitionData.petition_start_time
      );
      const endDateTime = formatDateTime(
        petitionData.petition_end_date_time?.toDate() || new Date(),
        petitionData.petition_end_time
      );

      const startElement = document.getElementById("startDateTime");
      const endElement = document.getElementById("endDateTime");
      if (startElement) startElement.textContent = startDateTime;
      if (endElement) endElement.textContent = endDateTime;

      // ターゲット数を設定
      const targetElement = document.getElementById("petitionTarget");
      if (targetElement) {
        targetElement.textContent = petitionData.max_supporters || 0;
      }

      // Add to Calendarボタンの設定
      const addToCalendarBtn = document.getElementById("addToCalendarBtn");
      if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener("click", () => {
          const calendarEvent = {
            title: petitionData.title || "Petition Event",
            start: petitionData.petition_start_date_time.toDate().toISOString(),
            end: petitionData.petition_end_date_time.toDate().toISOString(),
            description: "Support our petition!",
          };

          const googleCalendarUrl = createGoogleCalendarUrl(calendarEvent);
          window.open(googleCalendarUrl, "_blank");
        });
      }
    } catch (error) {
      console.error("Error fetching petition details:", error);
    }
  }

  setupShareFunctionality();
});

// 日時のフォーマット関数
function formatDateTime(date, time) {
  return `${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${time || ""}`;
}

// Googleカレンダー用URLの作成
function createGoogleCalendarUrl(event) {
  const encodedTitle = encodeURIComponent(event.title);
  const encodedDesc = encodeURIComponent(event.description);
  const startTime = event.start.replace(/-|:|\.\d\d\d/g, "");
  const endTime = event.end.replace(/-|:|\.\d\d\d/g, "");

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&details=${encodedDesc}&dates=${startTime}/${endTime}`;
}

// シェア機能のセットアップ
function setupShareFunctionality() {
  const shareButton = document.getElementById("shareButton");
  const shareOverlay = document.getElementById("shareOverlay");

  shareButton.addEventListener("click", () => {
    shareOverlay.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!shareOverlay.contains(e.target) && !shareButton.contains(e.target)) {
      shareOverlay.classList.remove("active");
    }
  });

  // メールでシェア
  const emailButton = shareOverlay.querySelector(".email");
  emailButton.addEventListener("click", () => {
    const url = window.location.href;
    const title = document.getElementById("petitionTitle").textContent;
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

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "copy-notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.remove();
  }, 2000);
}

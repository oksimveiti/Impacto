import {
  getFirestore,
  doc as firestoreDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { firebaseConfig } from "../../../../config/config.js";
import { GOOGLE_MAPS_API_KEY } from "../../../../config/config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// カテゴリーの表示名マッピング
const CATEGORY_DISPLAY_NAMES = {
  social: "Social Activism",
  politics: "Politics",
  community: "Community",
  education: "Education",
  human: "Human Rights",
  health: "Health",
  culture: "Culture",
  animal: "Animal Rights",
  justice: "Justice",
  others: "Others",
};

export async function getPetitionDetails(eventId) {
  if (!eventId) {
    console.error("No event ID provided in URL");
    // エラーメッセージを画面に表示
    const mainContent = document.querySelector(".event-detail");
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>Error</h2>
          <p>Event not found</p>
          <button class="btn-blue" onclick="window.location.href='../../../home/html/home.html'">
            Back to Home
          </button>
        </div>
      `;
    }
    return;
  }

  try {
    // イベントデータの取得
    const eventDoc = await getDoc(firestoreDoc(db, "events", eventId));
    console.log("Event data retrieved:", eventDoc.data());
    console.log("Event ID:", eventId);
    if (!eventDoc.exists()) {
      console.error("Event not found");
      return;
    }

    const eventData = eventDoc.data();
    console.log("Retrieved event data:", eventData); // デバッグ用

    // イベント情報の表示
    document.getElementById("eventTitle").textContent = eventData.title;
    document.getElementById("eventImage").src = eventData.image_url;

    // オーガナイザー情報の取得と表示
    const organizerId = eventData.organizer_id;
    console.log("Organizer ID:", organizerId); // organizerIdの値を確認
    if (organizerId) {
      try {
        // プロフィール画像を取得
        const profileSetupDoc = await getDoc(
          firestoreDoc(db, "profile_setup", organizerId)
        );
        if (!profileSetupDoc.exists()) {
          console.log(
            "Profile setup document does not exist for user:",
            organizerId
          );
        }
        console.log("Profile setup data:", profileSetupDoc.data()); // デバッグ用

        const profilePictureUrl = profileSetupDoc.exists()
          ? profileSetupDoc.data().basicInfo.profilePictureUrl
          : "../../../media/impacto-logo.png";

        console.log("Profile picture URL:", profilePictureUrl); // デバッグ用

        // bioの取得
        const bio = profileSetupDoc.exists()
          ? profileSetupDoc.data().basicInfo.bio
          : "No bio available";

        // ユーザー名を取得
        const userDoc = await getDoc(firestoreDoc(db, "users", organizerId));
        if (!userDoc.exists()) {
          console.log("User document does not exist for user:", organizerId);
        }
        console.log("User data:", userDoc.data()); // デバッグ用

        const username = userDoc.exists()
          ? userDoc.data().username
          : "Unknown Organizer";

        // ヘッダー部分のオーガナイザー情報を表示
        const headerOrganizerDiv = document.querySelector(".organizer");
        headerOrganizerDiv.innerHTML = `
          <img src="${profilePictureUrl}" alt="Organizer" class="organizer-image">
          <span class="organizer-name">${username}</span>
        `;

        // About the Organizer セクションのオーガナイザー情報を表示
        const eventOrganizerDiv = document.getElementById("eventOrganizer");
        eventOrganizerDiv.innerHTML = `
              <p class="organizer-bio">${bio}</p>
        `;
      } catch (error) {
        console.error("Error loading organizer info:", error);
      }
    }

    // 日時の表示
    const dateOptions = {
      weekday: "long", // Thursday
      month: "short", // Jan
      day: "numeric", // 30
      year: "numeric", // 2025
      hour: "numeric", // 2
      minute: "2-digit", // 00
      hour12: true, // PM
    };

    // カテゴリーの表示を修正
    const categoriesContainer = document.getElementById("eventCategories");
    if (eventData.event_categories && categoriesContainer) {
      categoriesContainer.innerHTML = ""; // 既存のコンテンツをクリア
      eventData.event_categories.forEach((category) => {
        const tag = document.createElement("span");
        tag.className = "category-tag";
        tag.textContent = category;
        categoriesContainer.appendChild(tag);
      });
    }

    // イベント詳細の表示
    document.getElementById("eventDescription").innerHTML =
      eventData.description;

    // 請願情報の表示
    if (
      eventData.petition_start_date_time &&
      eventData.petition_end_date_time
    ) {
      const petitionStartDate = eventData.petition_start_date_time.toDate();
      const petitionEndDate = eventData.petition_end_date_time.toDate();

      const startDateElement = document.getElementById("petitionStartDate");
      const endDateElement = document.getElementById("petitionEndDate");

      if (startDateElement && endDateElement) {
        startDateElement.textContent = petitionStartDate.toLocaleString(
          "en-US",
          dateOptions
        );
        endDateElement.textContent = petitionEndDate.toLocaleString(
          "en-US",
          dateOptions
        );
      }
    } else {
      console.error("Petition dates are missing");
    }

    // サポーター情報の表示
    const supporters = eventData.supporters || [];
    const maxSupporters = eventData.max_supporters || 0;
    const supporterCount = supporters.length;
    const supporterPercentage = (supporterCount / maxSupporters) * 100;

    const petitionTargetElement = document.getElementById("petitionTarget");
    if (petitionTargetElement) {
      petitionTargetElement.textContent = `${supporterCount.toLocaleString()} / ${maxSupporters.toLocaleString()} signatures`;
    }

    // プログレスバーの更新
    const progressBar = document.querySelector(".petition-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${Math.min(supporterPercentage, 100)}%`;
    }

    // コメントセクションの初期化
    const commentsRef = collection(db, "comments");
    const commentsQuery = query(
      commentsRef,
      where("event_id", "==", eventId),
      orderBy("timestamp", "desc")
    );

    onSnapshot(commentsQuery, async (snapshot) => {
      commentsSection.innerHTML = "";

      for (const commentDoc of snapshot.docs) {
        const commentData = commentDoc.data();
        const userId = commentData.user_id;

        try {
          // ユーザー情報を取得
          const userRef = firestoreDoc(db, "users", userId);
          const profileRef = firestoreDoc(db, "profile_setup", userId);
          const [userDoc, profileDoc] = await Promise.all([
            getDoc(userRef),
            getDoc(profileRef),
          ]);

          const username = userDoc.exists()
            ? userDoc.data().username
            : "Unknown User";
          const profilePicture = profileDoc.exists()
            ? profileDoc.data().basicInfo.profilePictureUrl
            : "../../../media/impacto-logo.png";

          // コメントのHTML作成
          const commentElement = document.createElement("div");
          commentElement.className = "comment";
          commentElement.innerHTML = `
            <div class="comment-user">
              <img src="${profilePicture}" alt="${username}" class="comment-user-avatar">
              <span class="comment-user-name">${username}</span>
            </div>
            <div class="comment-content">
              <p class="comment-text">${commentData.text}</p>
              <div class="comment-timestamp">
                ${commentData.timestamp
                  .toDate()
                  .toLocaleString("en-US", dateOptions)}
              </div>
            </div>
          `;

          commentsSection.appendChild(commentElement);
        } catch (error) {
          console.error("Error loading comment:", error);
        }
      }
    });

    // コメント投稿機能
    document
      .getElementById("submitComment")
      .addEventListener("click", async () => {
        const commentInput = document.getElementById("commentInput");
        const commentText = commentInput.value.trim();

        if (!commentText) return;

        if (!auth.currentUser) {
          alert("Please login to post a comment");
          return;
        }

        try {
          await addDoc(commentsRef, {
            event_id: eventId,
            user_id: auth.currentUser.uid,
            user_email: auth.currentUser.email,
            text: commentText,
            timestamp: new Date(),
          });

          commentInput.value = "";
        } catch (error) {
          console.error("Error posting comment:", error);
        }
      });
  } catch (error) {
    console.error("Error loading event petition details:", error);
  }
}

// 地図の初期化関数
// function initMap(geopoint, address) {
//   const map = new google.maps.Map(document.getElementById("map"), {
//     zoom: 15,
//     center: { lat: geopoint.latitude, lng: geopoint.longitude },
//   });

//   new google.maps.Marker({
//     map: map,
//     position: { lat: geopoint.latitude, lng: geopoint.longitude },
//     title: address,
//   });
// }

// Google Maps APIの読み込み
// const script = document.createElement("script");
// script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
// script.async = true;
// script.defer = true;
// document.head.appendChild(script);

//=====================================
// 参加資格をチェックする関数
//=====================================

export async function checkParticipantStatus(eventId, userId) {
  try {
    const eventRef = firestoreDoc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return {
        canAttend: false,
        message: "Event not found",
      };
    }

    const eventData = eventDoc.data();

    // 主催者チェック
    if (eventData.organizer_id === userId) {
      return {
        canAttend: false,
        message: "You are the organizer of this event",
      };
    }

    // 既に参加者かチェック
    if (eventData.participants?.includes(userId)) {
      return {
        canAttend: false,
        message: "You are already attending this event",
      };
    }

    // 参加可能人数チェック
    if (eventData.participants?.length >= eventData.max_participants) {
      return {
        canAttend: false,
        message: "This event is full",
      };
    }

    return { canAttend: true };
  } catch (error) {
    console.error("Error checking participant status:", error);
    throw error;
  }
}

// 参加者を追加する関数
export async function addParticipant(eventId, userId) {
  try {
    const eventRef = firestoreDoc(db, "events", eventId);
    const userRef = firestoreDoc(db, "users", userId);
    const eventDoc = await getDoc(eventRef);
    const eventData = eventDoc.data();

    // イベントとユーザーの両方を更新
    await Promise.all([
      updateDoc(eventRef, {
        participants: arrayUnion(userId),
        type: "event", // typeフィールドを追加
      }),
      updateDoc(userRef, {
        attend_events: arrayUnion(eventId),
      }),
    ]);

    // イベントデータを返す（確認ページで使用）
    return {
      title: eventData.title,
      startDateTime: eventData.event_start_date_time,
      endDateTime: eventData.event_end_date_time,
      address: eventData.address,
    };
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

// お気に入り状態をチェックする関数
export async function checkFavouriteStatus(userId, eventId) {
  try {
    const userRef = firestoreDoc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const saved_events = userDoc.data().saved_events || [];
      return saved_events.includes(eventId);
    }
    return false;
  } catch (error) {
    console.error("Error checking favourite status:", error);
    return false;
  }
}

// お気に入りを切り替える関数
export async function toggleFavourite(userId, eventId) {
  try {
    const userRef = firestoreDoc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        saved_events: [eventId],
      });
      return true;
    }

    const saved_events = userDoc.data().saved_events || [];
    const isFavourite = saved_events.includes(eventId);

    if (isFavourite) {
      await updateDoc(userRef, {
        saved_events: arrayRemove(eventId),
      });
      return false;
    } else {
      await updateDoc(userRef, {
        saved_events: arrayUnion(eventId),
      });
      return true;
    }
  } catch (error) {
    console.error("Error toggling favourite:", error);
    throw error;
  }
}

// サポート状態をチェックする関数
export async function checkSupportStatus(userId, eventId) {
  try {
    const userRef = firestoreDoc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const supporting_events = userDoc.data().supporting_events || [];
      return supporting_events.includes(eventId);
    }
    return false;
  } catch (error) {
    console.error("Error checking support status:", error);
    return false;
  }
}

// サポートを切り替える関数
export async function toggleSupport(userId, eventId) {
  try {
    const userRef = firestoreDoc(db, "users", userId);
    const eventRef = firestoreDoc(db, "events", eventId);
    const userDoc = await getDoc(userRef);
    const eventDoc = await getDoc(eventRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        supporting_events: [eventId],
      });
      await updateDoc(eventRef, {
        supporters: arrayUnion(userId),
      });
      return true;
    }

    const supporting_events = userDoc.data().supporting_events || [];
    const isSupporting = supporting_events.includes(eventId);

    if (isSupporting) {
      await updateDoc(userRef, {
        supporting_events: arrayRemove(eventId),
      });
      await updateDoc(eventRef, {
        supporters: arrayRemove(userId),
      });
      return false;
    } else {
      await updateDoc(userRef, {
        supporting_events: arrayUnion(eventId),
      });
      await updateDoc(eventRef, {
        supporters: arrayUnion(userId),
      });
      return true;
    }
  } catch (error) {
    console.error("Error toggling support:", error);
    throw error;
  }
}

// Attend状態をチェックする関数
export async function checkAttendStatus(userId, eventId) {
  try {
    const userRef = firestoreDoc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const attend_events = userDoc.data().attend_events || [];
      return attend_events.includes(eventId);
    }
    return false;
  } catch (error) {
    console.error("Error checking attend status:", error);
    return false;
  }
}

// Attendを切り替える関数
export async function toggleAttend(userId, eventId) {
  try {
    const userRef = firestoreDoc(db, "users", userId);
    const eventRef = firestoreDoc(db, "events", eventId);
    const userDoc = await getDoc(userRef);
    const eventDoc = await getDoc(eventRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        attend_events: [eventId],
      });
      await updateDoc(eventRef, {
        participants: arrayUnion(userId),
      });
      return true;
    }

    const attend_events = userDoc.data().attend_events || [];
    const isAttending = attend_events.includes(eventId);

    if (isAttending) {
      await updateDoc(userRef, {
        attend_events: arrayRemove(eventId),
      });
      await updateDoc(eventRef, {
        participants: arrayRemove(userId),
      });
      return false;
    } else {
      await updateDoc(userRef, {
        attend_events: arrayUnion(eventId),
      });
      await updateDoc(eventRef, {
        participants: arrayUnion(userId),
      });
      return true;
    }
  } catch (error) {
    console.error("Error toggling attend:", error);
    throw error;
  }
}

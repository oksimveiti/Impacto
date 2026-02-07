import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { db } from "../../../config/config.js";
import { vapidKey } from "./vapid.config.js";

const messaging = getMessaging();


async function requestNotificationPermission(uid) {
  try {
    // ユーザーに通知の許可を求める
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("ユーザーが通知を拒否しました");
      return;
    }

    // FCMトークンを取得
    const token = await getToken(messaging, { vapidKey: vapidKey });
    if (token) {
      console.log("取得したFCMトークン:", token);

      // Firestoreにトークンを保存（上書き）
      await setDoc(doc(db, "users", uid), { fcmToken: token }, { merge: true });
    } else {
      console.log("FCMトークンを取得できませんでした");
    }
  } catch (error) {
    console.error("FCMトークンの取得エラー:", error);
  }
}

// Obtain userID and Name
const userDataString = sessionStorage.getItem('userdata');
const userData = JSON.parse(userDataString);
const uid = userData.uid;
requestNotificationPermission(uid);



// トークンが更新されたらFirestoreに保存
onMessage(messaging, async () => {
  try {
    const newToken = await getToken(messaging, { vapidKey: vapidKey });
    if (newToken) {
      console.log("新しいFCMトークン:", newToken);

      // Firestoreのユーザー情報を更新
      await setDoc(doc(db, "users", uid), { fcmToken: newToken }, { merge: true });
    }
  } catch (error) {
    console.error("FCMトークンの更新エラー:", error);
  }
});


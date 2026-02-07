import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const auth = getAuth();

// ログイン状態の監視とキャッシュ
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ユーザーがログインしている場合
    const authData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      lastLoginTime: new Date().getTime(),
    };

    // IndexedDBにユーザー情報を保存
    localStorage.setItem("authUser", JSON.stringify(authData));

    // Service Workerが利用可能な場合、認証データをキャッシュ
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_AUTH_DATA",
        authData,
      });
    }
  } else {
    // ログアウト時
    localStorage.removeItem("authUser");
  }
});

// オフライン時のログイン状態チェック
function checkOfflineAuth() {
  const authUser = localStorage.getItem("authUser");
  if (authUser) {
    const userData = JSON.parse(authUser);
    const lastLoginTime = userData.lastLoginTime;
    const currentTime = new Date().getTime();

    // 24時間以内のログイン情報なら有効とする
    if (currentTime - lastLoginTime < 24 * 60 * 60 * 1000) {
      return true;
    }
  }
  return false;
}

// オフライン時のアクセス制御
window.addEventListener("offline", () => {
  if (!checkOfflineAuth()) {
    // 未ログインならログインページへリダイレクト
    window.location.href = "/authentication-Francisco/html/log-in.html";
  }
});

// Service Workerの登録
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker登録成功:", registration.scope);

      // 登録されているService Workerの状態を確認
      const swState = registration.active
        ? "有効"
        : registration.installing
        ? "インストール中"
        : registration.waiting
        ? "待機中"
        : "不明";
      console.log("Service Workerの状態:", swState);
    } catch (error) {
      console.error("Service Worker登録エラー:", error);
    }
  });
}

// オフライン/オンライン状態の検知と管理
window.addEventListener("load", () => {
  function updateOnlineStatus() {
    const condition = navigator.onLine ? "online" : "offline";
    console.log(`現在の状態: ${condition}`);

    const notification = document.getElementById("offline-notification");
    if (condition === "offline") {
      notification.style.display = "block";
      // オフライン時の追加処理
    } else {
      notification.style.display = "none";
      // オンラインに復帰時の処理
    }
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
});

// キャッシュの更新確認
function checkForUpdates() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

// 定期的なキャッシュ更新チェック（例：1時間ごと）
setInterval(checkForUpdates, 3600000);

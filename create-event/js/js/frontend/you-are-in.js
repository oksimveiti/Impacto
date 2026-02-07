document.addEventListener("DOMContentLoaded", function () {
  // URLパラメータからイベント情報を取得
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title");
  const start = new Date(params.get("start"));
  const end = new Date(params.get("end"));
  const address = params.get("address");

  // 情報を表示
  document.getElementById("eventTitle").textContent = title;
  document.getElementById(
    "startDateTime"
  ).textContent = `Start: ${start.toLocaleString()}`;
  document.getElementById(
    "endDateTime"
  ).textContent = `End: ${end.toLocaleString()}`;
  document.getElementById("eventAddress").textContent = address;

  // Add to Calendarボタンの処理
  document.getElementById("addToCalendarBtn").addEventListener("click", () => {
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${start
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}/${end
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}&location=${encodeURIComponent(address)}`;
    window.open(calendarUrl, "_blank");
  });

  // シェア機能の実装
  const shareButton = document.getElementById("shareButton");
  const shareOverlay = document.getElementById("shareOverlay");

  shareButton.addEventListener("click", () => {
    shareOverlay.classList.toggle("active");
  });

  // クリック外でオーバーレイを閉じる
  document.addEventListener("click", (e) => {
    if (!shareOverlay.contains(e.target) && !shareButton.contains(e.target)) {
      shareOverlay.classList.remove("active");
    }
  });

  // シェアボタンの処理
  const emailButton = shareOverlay.querySelector(".email");
  const facebookButton = shareOverlay.querySelector(".facebook");
  const copyButton = shareOverlay.querySelector(".copy-link");

  emailButton.addEventListener("click", () => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(
      `I'm attending this event!\n\nEvent Details:\n${title}\nStart: ${start.toLocaleString()}\nEnd: ${end.toLocaleString()}\nLocation: ${address}`
    )}`;
    window.open(mailtoLink);
  });

  facebookButton.addEventListener("click", () => {
    const url = window.location.href;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(shareUrl, "_blank");
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  });
});

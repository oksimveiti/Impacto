// const createBtn1 = document.getElementById(createBtn1);
// const createBtn2 = document.getElementById(createBtn2);
// const modal = document.getElementById("eventTypeModal");

document.addEventListener("DOMContentLoaded", function () {
  const createBtn1 = document.getElementById("createBtn1");

  // モーダルを作成
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-button">&times;</button>
      <h1>Select event type</h1>
      <div class="event-type-buttons">
        <a href="../../create-event-Naomi/html/event.html" class="btn-outline-blue">Event</a>
        <a href="../../create-event-Naomi/html/petition.html" class="btn-outline-blue">Petition</a>
        <a href="../../create-event-Naomi/html/event-petition.html" class="btn-outline-blue">Event & Petition</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // CREATEボタンのクリックイベント
  createBtn1.addEventListener("click", function (e) {
    e.preventDefault();
    modal.style.display = "flex";
  });

  // ×ボタンのクリックイベント
  const closeButton = modal.querySelector(".close-button");
  closeButton.addEventListener("click", function () {
    modal.style.display = "none";
  });

  // モーダル外クリックで閉じる
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // ESCキーで閉じる
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
    }
  });
});
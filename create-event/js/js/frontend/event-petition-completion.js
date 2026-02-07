 function handleViewEvent() {
   // セッションストレージからイベントIDを取得
   const eventId = sessionStorage.getItem("createdPetitionId");
   if (eventId) {
     // イベント詳細ページへリダイレクト
     window.location.href = `../../../event-details/html/event-details.html?id=${eventId}`;
   } else {
     console.error("No event ID found in session storage");
     alert("Could not find the event details. Please try again.");
   }
 }
document.addEventListener("DOMContentLoaded", function () {
  // 戻るボタンの要素を取得
  const backButton = document.querySelector(".back-button");

  if (backButton) {
    backButton.addEventListener("click", function () {
      // ブラウザの履歴を1つ前に戻る
      window.history.back();
    });
  }
});

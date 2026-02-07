// TinyMCE設定ファイル
export function initializeTinyMCE() {
  try {
    console.log("Starting TinyMCE initialization...");

    // TinyMCEが読み込まれているか確認
    if (typeof tinymce === "undefined") {
      console.error("TinyMCE is not loaded");
      return;
    }

    // 対象要素の存在確認
    const textArea = document.getElementById("eventDetails");
    if (!textArea) {
      console.error("Target textarea not found");
      return;
    }

    // シンプルな設定で初期化を試みる
    tinymce
      .init({
        selector: "#eventDetails",
        height: 300,
        menubar: false,
        plugins: ["lists", "link"],
        toolbar: "undo redo | bold italic | bullist numlist",
        setup: function (editor) {
          editor.on("init", function () {
            console.log("TinyMCE initialized successfully");
          });
          editor.on("error", function (e) {
            console.error("TinyMCE error:", e);
          });
        },
      })
      .then(function () {
        console.log("TinyMCE promise resolved");
      })
      .catch(function (error) {
        console.error("TinyMCE initialization failed:", error);
      });
  } catch (error) {
    console.error("Error in initializeTinyMCE:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const createBtn2 = document.getElementById("createBtn2");

  createBtn2.addEventListener("click", function () {
    window.parent.postMessage("openModal", "*");
  });
});

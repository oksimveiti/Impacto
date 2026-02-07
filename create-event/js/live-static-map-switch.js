document.addEventListener("DOMContentLoaded", function () {
  const showLiveMapBtn = document.getElementById("show-live-map");
  const staticMap = document.getElementById("map");
  const liveMap = document.getElementById("live-map");
  let isLiveMapShowing = false;

  showLiveMapBtn.addEventListener("click", function () {
    if (!isLiveMapShowing) {
      staticMap.style.display = "none";
      liveMap.style.display = "block";
      showLiveMapBtn.innerHTML =
        '<i class="fa-solid fa-map"></i> Show Static Map';
    } else {
      staticMap.style.display = "block";
      liveMap.style.display = "none";
      showLiveMapBtn.innerHTML =
        '<i class="fa-solid fa-location-dot"></i> Show Live Map';
    }
    isLiveMapShowing = !isLiveMapShowing;
  });
});

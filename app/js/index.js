const json = require("../data/video_urls.json");

function initApp() {
  let currentIndex = 0;
  let video = null;

  function renderVideo() {
    video.setAttribute("src", json.url + json.data[currentIndex]);
    video.play();
    currentIndex += 1;
  }

  function createVideo(selector = "#output") {
    video = document.createElement("video");
    document.querySelector(selector).appendChild(video);
    video.addEventListener("ended", renderVideo);
  }

  createVideo("#output");

  window.addEventListener("click", () => {
    document.querySelector("h1").remove();
    renderVideo();
    video.webkitRequestFullScreen();
  });
}

window.addEventListener("load", initApp);

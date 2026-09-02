const playpause_btn = document.getElementById("playpause_btn");
playpause_btn.addEventListener("click", () => {
	playpause_btn.children[0].classList.toggle("fa-pause");
	playpause_btn.children[0].classList.toggle("fa-play");

	if (playpause_btn.children[0].classList.contains("fa-play")) {
		document.querySelector("#player iframe").contentWindow.player.pause();
	}
	else {
		document.querySelector("#player iframe").contentWindow.player.play();
	}
});

const fullscreen_btn = document.getElementById("fullscreen_btn");

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.querySelector("#player iframe").requestFullscreen();
  } else {
    document.exitFullscreen?.();
  }
}

fullscreen_btn.addEventListener("click", toggleFullScreen);
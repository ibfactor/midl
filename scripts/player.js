function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

const playerFrame = document.querySelector("#player iframe");

const playpause_btn = document.getElementById("playpause_btn");
playpause_btn.addEventListener("click", () => {
	playpause_btn.children[0].classList.toggle("fa-pause");
	playpause_btn.children[0].classList.toggle("fa-play");

	if (playpause_btn.children[0].classList.contains("fa-play")) {
		playerFrame.contentWindow.player.pause();
		document.getElementById("playpause_text").innerText = "Play";
	}
	else {
		playerFrame.contentWindow.player.play();
		document.getElementById("playpause_text").innerText = "Pause";
	}
});

const fullscreen_btn = document.getElementById("fullscreen_btn");

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    playerFrame.requestFullscreen();
  } else {
    document.exitFullscreen?.();
  }
}

fullscreen_btn.addEventListener("click", toggleFullScreen);

const save_btn = document.getElementById("save_btn");
const load_btn = document.getElementById("load_btn");

save_btn.addEventListener("click", () => {
	if (!playpause_btn.children[0].classList.contains("fa-play")) {
		playpause_btn.click();
	}
	
	document.getElementById("saveState").classList.add("active-modal");
});

load_btn.addEventListener("click", () => {
	if (!playpause_btn.children[0].classList.contains("fa-play")) {
		playpause_btn.click();
	}
	
	document.getElementById("loadState").classList.add("active-modal");
});

const cloudBtn = document.getElementById("saveState").querySelectorAll("button")[0];
const downloadBtn = document.getElementById("saveState").querySelectorAll("button")[1];

function handleSave() {
		download("save.midl", JSON.stringify(localStorage));
		localStorage.clear();
		playerFrame.removeEventListener("load", handleSave);

		document.querySelector("#player iframe").contentWindow.player.load({
		    url: "https://cdn.midl.ibfr.org/" + window.currentItem,
		    allowScriptAccess: false
		});
}

downloadBtn.addEventListener("click", () => {
	downloadBtn.classList.add("loading");
	setTimeout(() => {
			playerFrame.contentWindow.location.reload();
			playerFrame.addEventListener("load", handleSave);
			downloadBtn.classList.remove("loading");
			document.getElementById("saveState").classList.remove("active-modal");
	}, 1000);
});

const cloudBtnUP = document.getElementById("loadState").querySelectorAll("button")[0];
const uploadBtn = document.getElementById("loadState").querySelectorAll("button")[1];

function handleLoad(event) {
		const reader = new FileReader();
	  reader.onload = (evt) => {
	  	const ls = JSON.parse(evt.target.result);
	  	Object.keys(ls).forEach((key) => {
	  		localStorage.setItem(key, ls[key]);
	  	});
			setTimeout(() => {
					uploadBtn.classList.remove("loading");
					document.getElementById("loadState").classList.remove("active-modal");
			}, 1000);
	  };
	  const text = reader.readAsText(event.target.files[0]);
}

uploadBtn.addEventListener("click", () => {
	uploadBtn.classList.add("loading");
	document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", handleLoad);


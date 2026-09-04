const banner = document.getElementById("banner");

banner.addEventListener("mouseenter", () => {
	banner.style.opacity = 0;
	setTimeout(() => {
		banner.classList.toggle("hovered");
		banner.style.opacity = 1;
	}, 400);
});

document.getElementById("home_button").addEventListener("click", () => {
	document.getElementById("loading_screen").classList.add("active");
	setTimeout(() => {
		document.getElementById("loading_screen").classList.remove("active");
		document.getElementById("game").classList.remove("active-pane");
		document.getElementById("top").innerText = "";

		document.querySelector("#player iframe").contentWindow.location.reload();
	}, 2000);
});

document.getElementById("search_button").addEventListener("click", () => {
	if (document.getElementById("search").style.display == "block") {

		document.getElementById("search").style.opacity = "0";
		setTimeout(() => {
			document.getElementById("search").style.display = "none";
			searchInput.focus();
		}, 200);

	}
	document.getElementById("search").style.display = "block";
	setTimeout(() => {
		document.getElementById("search").style.opacity = "1";
		searchInput.focus();
	}, 200);
});

function search(query) {
	document.getElementById("results").innerHTML = "<hr>";
	query = query.toLowerCase();
	var ind = 0;
	window.db.forEach((item, index) => {
		item.name = item.name.toLowerCase();
		if (!item.originalTitle) item.originalTitle = item.title;
		item.title = item.title.toLowerCase();
		if (item.name.includes(query) || query.includes(item.name) || item.title.includes(query) || query.includes(item.title)) {
			document.getElementById("results").innerHTML += `<div${(ind == 0) ? ` class="active"` : ""}>${item.originalTitle}</div>`;
			ind++;
		}
	});

	document.querySelectorAll("#results > div").forEach((elem, index) => {
		elem.addEventListener("click", () => {
			document.querySelector(`[data-id="${elem.innerText.trim()}"]`).click();
		});
		elem.addEventListener("mouseover", () => {
			document.querySelectorAll("#results > div").forEach((elem2) => {
				elem2.classList.remove("active");
			});
			elem.classList.add("active");
		});
	});
}

function handleSearchCloser(event) {
	if (event.target.closest("#search") || event.target.closest("#search_button")) return;
	document.getElementById("search").style.opacity = "0";
	setTimeout(() => {
		document.getElementById("search").style.display = "none";
		searchInput.focus();
	}, 200);
}

const searchInput = document.querySelector("#search > input");
document.body.addEventListener("click", handleSearchCloser);
searchInput.addEventListener("keyup", () => {
	if (searchInput.value) {
		searchInput.parentElement.classList.add("active");
		search(searchInput.value);
	}
	else {
		searchInput.parentElement.classList.remove("active");
		document.getElementById("results").innerHTML = "<hr>";
	}
});
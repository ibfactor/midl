const banner = document.getElementById("banner");

banner.addEventListener("mouseenter", () => {
	banner.style.opacity = 0;
	setTimeout(() => {
		banner.classList.toggle("hovered");
		banner.style.opacity = 1;
	}, 400);
});

document.getElementById("home_button").addEventListener("click", () => {
	alert("Home!");
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

	document.querySelectorAll("#results > div").forEach((elem) => {
		elem.addEventListener("mouseover", () => {
			document.querySelectorAll("#results > div").forEach((elem2) => {
				elem2.classList.remove("active");
			});
			elem.classList.add("active");
		});
	});
}

const searchInput = document.querySelector("#search > input");
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
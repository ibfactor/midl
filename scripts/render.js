function render(r1, r3) {
	r1.forEach((item) => {
		var img_link = "";
		r3.forEach((img) => {
			if (img.split(".")[0].toLowerCase() == item.name.split(".")[0].toLowerCase()) {
				img_link = img;
			}
		});

		document.getElementById("content").innerHTML +=
			`<div class="game-icon"><p>${item.title}</p><p></p><p style="background-image:url('/images/${img_link}');"></p></div>`
		;
	});
}

async function getDB() {
	const r0 = await fetch("/database.json");
	const r1 = await r0.json();

	const r2 = await fetch("/images.txt");
	const r3 = await r2.text();

	render(r1, r3.split("\n"));
}

getDB();
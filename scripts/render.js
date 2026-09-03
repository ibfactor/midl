function render(r1, r3) {
	r1.forEach((item) => {
		var img_link = "";
		r3.forEach((img) => {
			if (img.split(".")[0].toLowerCase() == item.name.split(".")[0].toLowerCase()) {
				img_link = img;
			}
		});

		const elem = document.createElement("div");

		elem.classList.add("game-icon");
		elem.innerHTML = `<p>${item.title}</p><p></p><p style="background-image:url('/images/${img_link}');"></p>`;

		document.getElementById("content").appendChild(elem);

		elem.addEventListener("click", async () => {
			elem.classList.add("active-game");
			document.getElementById("loading_screen").classList.add("active");
			window.currentItem = item.name;
			document.querySelector("#player iframe").contentWindow.player.load({
			    url: "https://cdn.midl.ibfr.org/" + item.name,
			    allowScriptAccess: false
			});

			await new Promise((resolve) => {
                const handler = (event) => {
                    if (event.data?.type === "ruffle-loaded") {
                        window.removeEventListener("message", handler);
                        resolve();
                    }
                };

                window.addEventListener("message", handler);
            });

			//setTimeout(() => {
				document.getElementById("loading_screen").classList.remove("active");
				document.getElementById("game").classList.add("active-pane");
				document.getElementById("top").innerText = elem.innerText;
			//}, 2000);

		});
	});
}

window.db = [];

async function getDB() {
	const r0 = await fetch("/database.json");
	const r1 = await r0.json();

	const r2 = await fetch("/images.txt");
	const r3 = await r2.text();

	window.db = r1;

	render(r1, r3.replaceAll("\r", "\n").split("\n"));
}

getDB();
async function getAccount() {
	const username = localStorage.getItem("username");
	const password = localStorage.getItem("password");
	if (!username || !password) {
		return;
	}

	const f0 = await fetch("/api/account_get", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"user": username,
			"pass": password,
			"game": game
		})
	});

	const f1 = await f0.json();

	if (!f1.success) {
		showToast("Failure", f1.msg);
		return;
	}

	if (Object.keys(f1.msg).length > 0) {
		document.getElementById("save_files").innerHTML = "";
		Object.keys(f1.msg).forEach((key) => {
			var scores = [];
			document.getElementById("save_files").innerHTML += `<div class="gameSaveAcc" onclick="document.getElementById('my_account').classList.remove('active-pane');document.querySelector('[data-id=\\'${window.db.find(item => item.name === key).title}\\']').click();">${window.db.find(item => item.name === key).title}<br><span>${f1.msg[key].length} save files</span></div>`;
			f1.msg[key].forEach((item) => {
				var thisGameScore = 1;
				const json = JSON.parse(item);
				Object.keys(json).forEach((itemKey) => {
					if (itemKey.includes("/" + key)) {
						const data = parseSOLFromBase64(json[itemKey]).data;
						Object.keys(data).forEach((final) => {
							const item = data[final];
							const lowerCaseItem = final.toLowerCase();
							if (lowerCaseItem.includes("highscore") || lowerCaseItem.includes("high score") || lowerCaseItem.includes("score") || lowerCaseItem.includes("level") || lowerCaseItem.includes("star")) {
								if (!Number.isFinite(item)) return;
								if (item == 0) return;
								thisGameScore *= item;
							}
						});
					}
				});
				scores.push(thisGameScore);
			});
			if (scores.length > 0) {
				const maxScore = Math.max(...scores);
				if (!document.getElementById("high_scores").innerHTML.includes("gameSaveAcc")) {
					document.getElementById("high_scores").innerHTML = "";
				}
				document.getElementById("high_scores").innerHTML += `<div class="gameSaveAcc" onclick="document.getElementById('my_account').classList.remove('active-pane');document.querySelector('[data-id=\\'${window.db.find(item => item.name === key).title}\\']').click();">${window.db.find(item => item.name === key).title}<br><span>Max Score: ${maxScore} MP</span></div>`;
			}
		});
	}
}


async function showSaves(game) {
	const username = localStorage.getItem("username");
	const password = localStorage.getItem("password");
	if (!username || !password) {
		return;
	}

	const f0 = await fetch("/api/get_saves", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"user": username,
			"pass": password,
			"game": game
		})
	});

	const f1 = await f0.json();

	if (!f1.success) {
		showToast("Failure", f1.msg);
		return;
	}

	document.getElementById("loadState").classList.remove("active-modal");
	cloudBtnUP.classList.remove("loading");
	document.getElementById("saves").classList.add("active-modal");
	document.getElementById("options").innerHTML = "";
	f1.msg.forEach((item, index) => {
		document.getElementById("options").innerHTML += `<button onclick="handleCloudLoad('${btoa(item)}');"><i class="fas fa-floppy-disk"></i><strong>Save ${index + 1}</strong></button>`;
	});
	if (f1.msg.length < 1) {
		document.getElementById("options").innerHTML = "You haven't saved anything yet!";
	}
}

async function sendSave(state, game, username, password) {
	if (!username || !password) {
		return;
	}

	const f0 = await fetch("/api/save_state", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"user": username,
			"pass": password,
			"state": state,
			"game": game
		})
	});

	const f1 = await f0.json();

	if (!f1.success) {
		showToast("Failure", f1.msg);
		return;
	}

	showToast("Success", f1.msg);
}

function showAccountPage() {
	document.getElementById("account").classList.remove("active-pane");
	document.getElementById("loading_screen").classList.add("active");
	setTimeout(() => {
		document.getElementById("my_account").classList.add("active-pane");
		document.getElementById("loading_screen").classList.remove("active");
	}, 1000);
	document.getElementById("username_txt").innerText = localStorage.getItem("username");
	getAccount();
}

async function processSignUp(username, password) {
	if (!username || !password) {
		showToast("Failure", "Missing username or password!");
		return;
	}

	const f0 = await fetch("/api/account_new", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"user": username,
			"pass": password
		})
	});

	const f1 = await f0.json();

	if (!f1.success) {
		showToast("Failure", f1.msg);
		return;
	}

	showToast("Success", f1.msg);
}

async function processSignIn() {
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	if (!username || !password) {
		showToast("Failure", "Missing username or password!");
		return;
	}

	const f0 = await fetch("/api/account", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			"user": username,
			"pass": password
		})
	});

	const f1 = await f0.json();

	if (!f1.success) {
		if (f0.status == 401) {
			showToast("Success", "Account does not exist, creating new account...");
			setTimeout(() => {
				processSignUp(username, password);
			}, 1600);
			return;
		}
		showToast("Failure", f1.msg);
		return;
	}

	showToast("Success", f1.msg);
	localStorage.setItem("username", username);
	localStorage.setItem("password", password);
	showAccountPage();
}

const signin_btn = document.getElementById("signin_btn");
signin_btn.addEventListener("click", () => {
	document.getElementById("loading_screen").classList.add("active");
	setTimeout(() => {
		document.getElementById("account").classList.add("active-pane");
		document.getElementById("loading_screen").classList.remove("active");
	}, 1000);
});

document.getElementById("next_btn").addEventListener("click", processSignIn);


if (localStorage.getItem("username") && localStorage.getItem("password")) {
	document.getElementById("tag").children[1].innerHTML = localStorage.getItem("username");
	document.getElementById("tag").style.paddingTop = "10px";
	document.getElementById("tag").style.paddingBottom = "10px";
	document.getElementById("tag").style.paddingRight = "20px";
	document.getElementById("tag").style.cursor = "pointer";
	document.getElementById("tag").addEventListener("click", () => {
		showAccountPage();
	});
	document.querySelectorAll("#saveState button")[0].style.display = "block";
	document.querySelectorAll("#loadState button")[0].style.display = "block";
}


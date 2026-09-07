async function sendSave(state, game) {
	const username = localStorage.getItem("username");
	const password = localStorage.getItem("password");
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
}


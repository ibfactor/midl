import express from "express";
import path from "path";
import { JSONFilePreset } from "lowdb/node";
import { sha256 } from 'js-sha256';
import { parseSOLFromBase64 } from "./parse-sol-b64.js";

const app = express();
const PORT = 8088;

const db = await JSONFilePreset("databases/accounts.json", {});
const saves_db = await JSONFilePreset("databases/saves.json", {});

app.use(express.json()); 

app.use(["/server.js", "/package.json", "package-lock.json", "/databases", "/decode_sol.js", "parse-sol-b64.js"], (req, res) => {
    res.status(403).send("Access Denied");
});


app.get("/api/leaderboard", async (req, res) => {
    var response = {
        success: false,
        msg: "Missing fields."
    };

    if (!req.query.game) {
        res.status(400).json(response);
        return;
    }

    var finalGameResponse = [];

    Object.keys(saves_db.data).forEach((user) => {
        var userHighScore = [];
        Object.keys(saves_db.data[user]).forEach((game) => {
            const saves = saves_db.data[user][game];
            saves.forEach((item) => {

                var thisGameScore = 1;
                const json = JSON.parse(item);
                Object.keys(json).forEach((itemKey) => {
                    if (itemKey.includes("/" + req.query.game)) {
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
                userHighScore.push(thisGameScore);
            });
        });
        if (Math.max(...userHighScore) == 1) return;
        finalGameResponse.push({
            "user": user,
            "score": Math.max(...userHighScore)
        });
    });

    response = {
        success: true,
        msg: finalGameResponse
    };

    res.status(200).json(response); 
});

app.post("/api/account_get", async (req, res) => {
    const body = req.body;

    var response = {
        success: false,
        msg: "Invalid username or password."
    };

    if (!body.user || !body.pass) {
        res.status(400).json(response);
        return;
    }

    if (!db.data[body.user]) {
        res.status(401).json(response);
        return;
    }

    if (db.data[body.user].password != sha256(body.pass)) {
        res.status(400).json(response);
        return;
    }

    if (!saves_db.data[body.user]) {
        saves_db.data[body.user] = {};
        await saves_db.write();
    }
    
    response = {
        success: true,
        msg: saves_db.data[body.user]
    };

    res.status(200).json(response); 
});

app.post("/api/get_saves", async (req, res) => {
    const body = req.body;

    var response = {
        success: false,
        msg: "Invalid username or password."
    };

    if (!body.user || !body.pass) {
        res.status(400).json(response);
        return;
    }

    if (!db.data[body.user]) {
        res.status(401).json(response);
        return;
    }

    if (db.data[body.user].password != sha256(body.pass)) {
        res.status(400).json(response);
        return;
    }

    if (!body.game) {
        response = {
            success: false,
            msg: "Nothing to load!"
        };
        res.status(201).json(response);
        return;
    }

    if (!saves_db.data[body.user]) {
        saves_db.data[body.user] = {};
        await saves_db.write();
    }
    if (!saves_db.data[body.user][body.game]) {
        saves_db.data[body.user][body.game] = [];
        await saves_db.write();
    }
    
    response = {
        success: true,
        msg: saves_db.data[body.user][body.game]
    };

    res.status(200).json(response); 
});

app.post("/api/save_state", async (req, res) => {
    const body = req.body;

    var response = {
        success: false,
        msg: "Invalid username or password."
    };

    if (!body.user || !body.pass) {
        res.status(400).json(response);
        return;
    }

    if (!db.data[body.user]) {
        res.status(401).json(response);
        return;
    }

    if (db.data[body.user].password != sha256(body.pass)) {
        res.status(400).json(response);
        return;
    }

    if (!body.state || !body.game) {
        response = {
            success: false,
            msg: "Nothing to save!"
        };
        res.status(201).json(response);
        return;
    }

    if (!saves_db.data[body.user]) {
        saves_db.data[body.user] = {};
    }
    if (!saves_db.data[body.user][body.game]) {
        saves_db.data[body.user][body.game] = [];
    }
    saves_db.data[body.user][body.game].push(body.state);

    await saves_db.write();

    response = {
        success: true,
        msg: "Your save file has been saved."
    };

    res.status(200).json(response); 
});


app.post("/api/account", (req, res) => {
    const body = req.body;

    var response = {
        success: false,
        msg: "Invalid username or password."
    };

    if (!body.user || !body.pass) {
        res.status(400).json(response);
        return;
    }

    if (!db.data[body.user]) {
        res.status(401).json(response);
        return;
    }

    if (db.data[body.user].password != sha256(body.pass)) {
        res.status(400).json(response);
        return;
    }

    response = {
        success: true,
        msg: "Logged in successfully."
    };

    res.status(200).json(response); 
});

app.post("/api/account_new", async (req, res) => {
    const body = req.body;

    var response = {
        success: false,
        msg: "Invalid username or password."
    };

    if (!body.user || !body.pass) {
        res.status(400).json(response);
        return;
    }

    if (db.data[body.user]) {
        res.status(401).json(response);
        return;
    }


    db.data[body.user] = {
        "password": sha256(body.pass)
    };

    await db.write();

    response = {
        success: true,
        msg: "Account created successfully."
    };

    res.status(200).json(response); 
});

app.use(express.static(import.meta.dirname, {
    extensions: ["html"]
}));

app.listen(PORT, () => {
    console.log("Server is running on http://localhost:" + PORT);
});

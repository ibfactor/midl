import express from "express";
import path from "path";
import { JSONFilePreset } from "lowdb/node";
import { sha256 } from 'js-sha256';

const app = express();
const PORT = 8088;

const db = await JSONFilePreset("databases/accounts.json", {});

app.use(express.json()); 

app.use(["/server.js", "/package.json", "package-lock.json", "/databases"], (req, res) => {
    res.status(403).send("Access Denied");
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

app.use(express.static(import.meta.dirname));

app.listen(PORT, () => {
    console.log("Server is running on http://localhost:" + PORT);
});
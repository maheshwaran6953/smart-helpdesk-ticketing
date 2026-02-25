const db = require("../config/db");

const User = {};

User.create = (newUser, result) => {
    const query = `
        INSERT INTO users (name, email, password, role, expertise)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [
        newUser.name,
        newUser.email,
        newUser.password,
        newUser.role || "user",
        newUser.expertise || null,
        ],
        (err, res) => {
        if (err) {
            console.error("Error creating user:", err);
            result(err, null);
            return;
        }
        result(null, { id: res.insertId, ...newUser });
        },
    );
    };

    User.findByEmail = (email, result) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, res) => {
        if (err) {
        result(err, null);
        return;
        }
        if (res.length) {
        result(null, res[0]);
        return;
        }
        result({ kind: "not_found" }, null);
    });
    };

    User.findById = (id, result) => {
    db.query(
        "SELECT id, name, email, role, expertise FROM users WHERE id = ?",
        [id],
        (err, res) => {
        if (err) {
            result(err, null);
            return;
        }
        if (res.length) {
            result(null, res[0]);
            return;
        }
        result({ kind: "not_found" }, null);
        },
    );
};

module.exports = User;

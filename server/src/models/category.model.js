const db = require('../config/db');

const Category = {};

Category.getAll = (result) => {
    db.query("SELECT * FROM categories ORDER BY name", (err, res) => {
        if (err) return result(err, null);
        result(null, res);
    });
};

Category.findById = (id, result) => {
    db.query("SELECT * FROM categories WHERE id = ?", [id], (err, res) => {
        if (err) return result(err, null);
        if (res.length) return result(null, res[0]);
        result({ kind: "not_found" }, null);
    });
};

module.exports = Category;
const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');

// Middleware to check for admin role (placeholder)
const isAdmin = (req, res, next) => {
    // In a real app, you would validate the JWT and check the user's role.
    // For now, we'll assume the user is an admin.
    next();
};

// GET all users
router.get('/', isAdmin, (req, res) => {
    const sql = "SELECT id, username, role, permissions FROM users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        const users = rows.map(user => ({
            ...user,
            permissions: user.permissions ? JSON.parse(user.permissions) : {}
        }));
        res.json({
            "message": "success",
            "data": users
        });
    });
});

// POST a new user
router.post('/', isAdmin, (req, res) => {
    const { username, password, role, permissions } = req.body;
    if (!username || !password) {
        return res.status(400).json({ "error": "Username and password are required" });
    }
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const permissionsJSON = JSON.stringify(permissions || {});

    const sql = 'INSERT INTO users (username, password, role, permissions) VALUES (?,?,?,?)';
    const params = [username, hashedPassword, role, permissionsJSON];
    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, username, role, permissions }
        });
    });
});

// PUT update a user
router.put('/:id', isAdmin, (req, res) => {
    const { username, password, role, permissions } = req.body;
    
    let sql;
    let params;

    if (password) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        sql = 'UPDATE users SET username = COALESCE(?,username), password = ?, role = COALESCE(?,role), permissions = COALESCE(?,permissions) WHERE id = ?';
        params = [username, hashedPassword, role, permissions ? JSON.stringify(permissions) : undefined, req.params.id];
    } else {
        sql = 'UPDATE users SET username = COALESCE(?,username), role = COALESCE(?,role), permissions = COALESCE(?,permissions) WHERE id = ?';
        params = [username, role, permissions ? JSON.stringify(permissions) : undefined, req.params.id];
    }

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

// DELETE a user
router.delete('/:id', isAdmin, (req, res) => {
    if (req.params.id === '1') {
        return res.status(400).json({ "error": "Cannot delete the primary admin account." });
    }
    const sql = 'DELETE FROM users WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ "error": "User not found." });
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

module.exports = router;

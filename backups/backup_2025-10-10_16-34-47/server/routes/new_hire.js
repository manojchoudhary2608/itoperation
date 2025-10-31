const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all new hires
router.get('/', (req, res) => {
    const sql = "SELECT * FROM new_hires";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST a new hire
router.post('/', (req, res) => {
    const { name, address, mobile_number, date_of_joining, status } = req.body;
    if (!name) {
        res.status(400).json({ "error": "Name is required" });
        return;
    }
    const sql = 'INSERT INTO new_hires (name, address, mobile_number, date_of_joining, status) VALUES (?,?,?,?,?)';
    const params = [name, address, mobile_number, date_of_joining, status];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, name, address, mobile_number, date_of_joining, status }
        });
    });
});

// PUT update a new hire
router.put('/:id', (req, res) => {
    const { name, address, mobile_number, date_of_joining, status } = req.body;
    const sql = `UPDATE new_hires set 
                 name = COALESCE(?,name), 
                 address = COALESCE(?,address), 
                 mobile_number = COALESCE(?,mobile_number), 
                 date_of_joining = COALESCE(?,date_of_joining), 
                 status = COALESCE(?,status) 
                 WHERE id = ?`;
    const params = [name, address, mobile_number, date_of_joining, status, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            changes: this.changes
        });
    });
});

// DELETE a new hire
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM new_hires WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../database');
const csv = require('csv-parser');
const { Readable } = require('stream');

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

// POST bulk upload new hires
router.post('/bulk-upload', async (req, res) => {
    const csvData = req.body.csvData;
    const newHiresToInsert = [];

    if (!csvData) {
        return res.status(400).json({ "error": "No CSV data provided" });
    }

    const s = new Readable();
    s.push(csvData);
    s.push(null); // Mark the end of the stream

    s.pipe(csv())
        .on('data', (data) => {
            // Assuming CSV headers match your database columns (case-insensitive for robustness)
            const newHire = {
                name: data['Name'] || data['name'],
                address: data['Address'] || data['address'],
                mobile_number: data['Mobile Number'] || data['mobile_number'],
                date_of_joining: data['Date of Joining'] || data['date_of_joining'],
                status: data['Status'] || data['status'] || 'Open' // Default to 'Open' if not provided
            };
            newHiresToInsert.push(newHire);
        })
        .on('end', async () => {
            if (newHiresToInsert.length === 0) {
                return res.status(400).json({ "error": "No valid data found in CSV" });
            }

            db.serialize(() => {
                db.run("BEGIN TRANSACTION;");
                const stmt = db.prepare('INSERT INTO new_hires (name, address, mobile_number, date_of_joining, status) VALUES (?,?,?,?,?)');

                newHiresToInsert.forEach(hire => {
                    stmt.run([hire.name, hire.address, hire.mobile_number, hire.date_of_joining, hire.status], (err) => {
                        if (err) {
                            console.error("Error inserting new hire:", err.message);
                            // Decide how to handle individual errors: skip, log, or rollback
                        }
                    });
                });

                stmt.finalize();
                db.run("COMMIT;", (err) => {
                    if (err) {
                        return res.status(500).json({ "error": "Transaction failed: " + err.message });
                    }
                    res.json({ "message": `Successfully added ${newHiresToInsert.length} new hires.` });
                });
            });
        })
        .on('error', (err) => {
            res.status(500).json({ "error": "Error parsing CSV: " + err.message });
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
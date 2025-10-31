const express = require('express');
const router = express.Router();
const db = require('../database');
const { sendNewHireEmail, sendNewHireClosedEmail, sendNewHireCalledOffEmail } = require('../emailService');
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
        console.log("New Hires data from DB:", rows); // Log data to console
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST a new hire
router.post('/', (req, res) => {
    const { name, address, mobile_number, date_of_joining, status, addedBy } = req.body;
    if (!name) {
        res.status(400).json({ "error": "Name is required" });
        return;
    }
    const sql = 'INSERT INTO new_hires (name, address, mobile_number, date_of_joining, status, created_at, added_by) VALUES (?,?,?,?,?,?,?)';
    const params = [name, address, mobile_number, date_of_joining, status, new Date().toISOString(), addedBy];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const newHire = { id: this.lastID, name, address, mobile_number, date_of_joining, status };
        res.json({
            "message": "success",
            "data": newHire
        });
        sendNewHireEmail({ ...newHire, addedBy });
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
    s._read = () => {}; // _read is required but can be noop
    s.push(csvData, 'utf8');
    s.push(null); // Mark the end of the stream

    s.pipe(csv({mapHeaders: ({ header }) => header.trim(), mapValues: ({ value }) => value.trim()}))
        .on('data', (data) => {
            const sanitizeValue = (val) => typeof val === 'string' ? val.replace(/[^ -~]/g, '') : val; // Remove non-printable ASCII

            const newHire = {
                name: sanitizeValue(data['Name'] || data['name']),
                address: sanitizeValue(data['Address'] || data['address']),
                mobile_number: sanitizeValue(data['Mobile Number'] || data['mobile_number']),
                date_of_joining: sanitizeValue(data['Date of Joining'] || data['date_of_joining']),
                status: sanitizeValue(data['Status'] || data['status'] || 'Open'),
                added_by: 'Bulk Upload'
            };
            newHiresToInsert.push(newHire);
        })
        .on('end', async () => {
            if (newHiresToInsert.length === 0) {
                return res.status(400).json({ "error": "No valid data found in CSV" });
            }

            db.serialize(() => {
                db.run("BEGIN TRANSACTION;", (err) => {
                    if (err) {
                        console.error("Error beginning transaction:", err.message);
                        return res.status(500).json({ "error": "Failed to begin transaction: " + err.message });
                    }
                    const stmt = db.prepare('INSERT INTO new_hires (name, address, mobile_number, date_of_joining, status, added_by) VALUES (?,?,?,?,?,?)');
                    let successfulInserts = 0;
                    let failedInserts = 0;

                    newHiresToInsert.forEach(hire => {
                        stmt.run([hire.name, hire.address, hire.mobile_number, hire.date_of_joining, hire.status, hire.added_by], function (err) {
                            if (err) {
                                console.error("Error inserting new hire:", err.message, hire);
                                failedInserts++;
                            } else {
                                successfulInserts++;
                            }
                        });
                    });

                    stmt.finalize((err) => {
                        if (err) {
                            console.error("Error finalizing statement:", err.message);
                            db.run("ROLLBACK;");
                            return res.status(500).json({ "error": "Failed to finalize statement: " + err.message });
                        }
                        console.log("Attempting COMMIT;");
                        db.run("COMMIT;", (err) => {
                            if (err) {
                                console.error("Error committing transaction:", err.message);
                                db.run("ROLLBACK;");
                                return res.status(500).json({ "error": "Transaction failed: " + err.message });
                            }
                            res.json({ "message": `Bulk upload complete. Successfully added ${successfulInserts} new hires, ${failedInserts} failed.` });
                        });
                    });
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
    const id = req.params.id;

    db.get("SELECT * FROM new_hires WHERE id = ?", [id], (err, originalHire) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        if (!originalHire) {
            return res.status(404).json({ "error": "New hire not found" });
        }

        const originalStatus = originalHire.status.trim();
        const newStatus = status ? status.trim() : originalStatus;

        const sql = `UPDATE new_hires set 
                     name = COALESCE(?,name), 
                     address = COALESCE(?,address), 
                     mobile_number = COALESCE(?,mobile_number), 
                     date_of_joining = COALESCE(?,date_of_joining), 
                     status = COALESCE(?,status) 
                     WHERE id = ?`;
        const params = [name, address, mobile_number, date_of_joining, newStatus, id];

        db.run(sql, params, function (err) {
            if (err) {
                return res.status(400).json({ "error": err.message });
            }

            const changes = this.changes;
            if (changes === 0) {
                return res.json({ message: "success", changes: 0 });
            }

            db.get("SELECT * FROM new_hires WHERE id = ?", [id], (err, updatedHire) => {
                if (err) {
                    // If we can't get the updated hire, we can't send email, but the update succeeded.
                    return res.json({ message: "Update successful, but failed to fetch data for email.", changes: changes });
                }

                if (newStatus === 'Close' && originalStatus !== 'Close') {
                    const createdDate = updatedHire.created_at ? new Date(updatedHire.created_at) : new Date();
                    const closedDate = new Date();
                    const diffTime = Math.abs(closedDate - createdDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    sendNewHireClosedEmail({ ...updatedHire, days: diffDays, addedBy: updatedHire.added_by });
                } else if (newStatus === 'Called Off' && originalStatus !== 'Called Off') {
                    sendNewHireCalledOffEmail({ ...updatedHire, addedBy: updatedHire.added_by });
                } else {
                    sendNewHireEmail({ ...updatedHire, addedBy: updatedHire.added_by });
                }

                res.json({ message: "success", changes: changes });
            });
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

// TEMPORARY: Route to delete all new hires for debugging
router.delete('/clear-all', (req, res) => {
    const sql = 'DELETE FROM new_hires';
    db.run(sql, [], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": `Successfully deleted ${this.changes} records from new_hires table.` });
    });
});

// TEMPORARY: Route to get count of new hires for debugging
router.get('/count', (req, res) => {
    const sql = "SELECT COUNT(*) as count FROM new_hires";
    db.get(sql, [], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "count": row.count
        });
    });
});

module.exports = router;
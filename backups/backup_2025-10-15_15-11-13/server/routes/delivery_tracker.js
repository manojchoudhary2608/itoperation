const express = require('express');
const router = express.Router();
const db = require('../database');
const { sendNewHireEmail, sendDeliveryTrackerEmail } = require('../emailService');
const csv = require('csv-parser');
const { Readable } = require('stream');
const fs = require('fs'); // Add fs module for file logging
const path = require('path'); // Add path module

const logFilePath = path.join(__dirname, 'delivery_tracker_debug.log');

function writeLog(message) {
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
}

// Helper function to validate delivery data
const validateDelivery = (delivery) => {
    if (!delivery.name || !delivery.address || !delivery.asset_type || !delivery.mobile_number || !delivery.courier_partner || !delivery.tracking_number || !delivery.courier_date || !delivery.it_status || !delivery.final_status || !delivery.delivery_date || delivery.new_joiner === undefined) {
        return { isValid: false, message: "All fields are required." };
    }
    return { isValid: true };
};

// GET all deliveries
router.get('/', (req, res) => {
    const sql = "SELECT * FROM deliveries";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":rows
        });
    });
});

// GET a single delivery by id
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM deliveries WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data":row
        });
    });
});

// POST a new delivery
router.post('/', (req, res) => {
    const { isValid, message } = validateDelivery(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner } = req.body;
    const sql = 'INSERT INTO deliveries (name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
    const params = [name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, ...req.body }
        });
        sendDeliveryTrackerEmail({ id: this.lastID, ...req.body });
    });
});

// PUT (Update) an existing delivery
router.put('/:id', (req, res) => {
    const { isValid, message } = validateDelivery(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner } = req.body;
    const sql = 'UPDATE deliveries SET name = ?, address = ?, asset_type = ?, mobile_number = ?, courier_partner = ?, tracking_number = ?, courier_date = ?, it_status = ?, final_status = ?, delivery_date = ?, new_joiner = ? WHERE id = ?';
    const params = [name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            message: "success",
            data: { id: req.params.id, changes: this.changes, ...req.body }
        });
        if (this.changes > 0) {
            sendDeliveryTrackerEmail({ id: req.params.id, ...req.body });
        }
    });
});

// POST bulk upload deliveries
router.post('/bulk-upload', async (req, res) => {
    writeLog("Bulk upload route hit.");
    const csvData = req.body.csvData;
    const deliveriesToInsert = [];

    if (!csvData) {
        writeLog("No CSV data provided.");
        return res.status(400).json({ "error": "No CSV data provided" });
    }

    const s = new Readable();
    s._read = () => {};
    s.push(csvData, 'utf8');
    s.push(null);

    writeLog(`CSV Data Length: ${csvData.length}`);

    s.pipe(csv({}))
        .on('data', (data) => {
            writeLog(`CSV row data received: ${JSON.stringify(data)}`);
            const sanitizeValue = (val) => typeof val === 'string' ? val.replace(/[^ -~]/g, '') : val;

            const delivery = {
                name: sanitizeValue(data['Name'] || data['name']),
                address: sanitizeValue(data['Address'] || data['address']),
                mobile_number: sanitizeValue(data['Mobile Number'] || data['mobile_number']),
                asset_type: sanitizeValue(data['Asset Type'] || data['asset_type'] || 'Unknown'),
                courier_partner: sanitizeValue(data['Courier Partner'] || data['courier_partner']),
                tracking_number: sanitizeValue(data['Tracking Number'] || data['tracking_number']),
                courier_date: sanitizeValue(data['Courier Date'] || data['courier_date']),
                it_status: sanitizeValue(data['IT Status'] || data['it_status'] || 'Configured'),
                final_status: sanitizeValue(data['Final Status'] || data['final_status'] || 'Shipment Sent'),
                delivery_date: sanitizeValue(data['Delivery Date'] || data['delivery_date']),
                new_joiner: sanitizeValue(data['New Joiner'] || data['new_joiner'] || 'No'),
            };
            deliveriesToInsert.push(delivery);
        })
        .on('end', async () => {
            writeLog(`CSV parsing finished. Deliveries to insert: ${deliveriesToInsert.length}`);
            if (deliveriesToInsert.length === 0) {
                writeLog("No valid data found in CSV after parsing.");
                return res.status(400).json({ "error": "No valid data found in CSV" });
            }

            db.serialize(() => {
                db.run("BEGIN TRANSACTION;", (err) => {
                    if (err) {
                        writeLog(`Error beginning transaction: ${err.message}`);
                        return res.status(500).json({ "error": "Failed to begin transaction: " + err.message });
                    }
                    const stmt = db.prepare('INSERT INTO deliveries (name, address, asset_type, mobile_number, courier_partner, tracking_number, courier_date, it_status, final_status, delivery_date, new_joiner) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
                    let successfulInserts = 0;
                    let failedInserts = 0;

                    function insertDelivery(index) {
                        if (index >= deliveriesToInsert.length) {
                            stmt.finalize((err) => {
                                if (err) {
                                    writeLog(`Error finalizing statement: ${err.message}`);
                                    db.run("ROLLBACK;");
                                    return res.status(500).json({ "error": "Failed to finalize statement: " + err.message });
                                }
                                writeLog("Attempting COMMIT;");
                                db.run("COMMIT;", (err) => {
                                    if (err) {
                                        writeLog(`Error committing transaction: ${err.message}`);
                                        db.run("ROLLBACK;");
                                        return res.status(500).json({ "error": "Transaction failed: " + err.message });
                                    }
                                    writeLog(`Bulk upload complete. Successfully added ${successfulInserts} deliveries, ${failedInserts} failed.`);
                                    res.json({ "message": `Bulk upload complete. Successfully added ${successfulInserts} deliveries, ${failedInserts} failed.` });
                                });
                            });
                            return;
                        }

                        const delivery = deliveriesToInsert[index];
                        stmt.run([delivery.name, delivery.address, delivery.asset_type, delivery.mobile_number, delivery.courier_partner, delivery.tracking_number, delivery.courier_date, delivery.it_status, delivery.final_status, delivery.delivery_date, delivery.new_joiner], function (err) {
                            if (err) {
                                writeLog(`Error inserting delivery (bulk): ${err.message} - ${JSON.stringify(delivery)}`);
                                failedInserts++;
                            } else {
                                successfulInserts++;
                                writeLog(`Successfully inserted delivery (bulk): ${delivery.name}`);
                                // sendDeliveryTrackerEmail({ id: this.lastID, ...delivery });
                            }
                            insertDelivery(index + 1);
                        });
                    }

                    insertDelivery(0);
                });
            });
        })
        .on('error', (err) => {
            writeLog(`Error parsing CSV stream: ${err.message}`);
            res.status(500).json({ "error": "Error parsing CSV: " + err.message });
        });
});

// DELETE a delivery
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM deliveries WHERE id = ?';
    const params = [req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({"message":"deleted", changes: this.changes});
    });
});

module.exports = router;
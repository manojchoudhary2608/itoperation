
const express = require('express');
const router = express.Router();
const db = require('../database');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Helper function to validate asset data
const validateAsset = (asset) => {
    if (!asset.asset_tag || !asset.asset_type || !asset.status) {
        return { isValid: false, message: "Asset Tag, Asset Type, and Status are required." };
    }
    return { isValid: true };
};

// GET all assets
router.get('/', (req, res) => {
    const sql = "SELECT * FROM assets";
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

// GET a single asset by id
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM assets WHERE id = ?";
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

// POST a new asset
router.post('/', (req, res) => {
    const { isValid, message } = validateAsset(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { asset_tag, serial_number, asset_type, make, model, assigned_to, gaid, email_id, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, monitor1_asset_tag, monitor1_serial_number, monitor2_asset_tag, monitor2_serial_number, headset_asset_tag, headset_serial_number, yubikey_number, webcam_number, reporting_manager, manager_email_id } = req.body;
    const sql = 'INSERT INTO assets (asset_tag, serial_number, asset_type, make, model, assigned_to, gaid, email_id, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, monitor1_asset_tag, monitor1_serial_number, monitor2_asset_tag, monitor2_serial_number, headset_asset_tag, headset_serial_number, yubikey_number, webcam_number, reporting_manager, manager_email_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    const params = [asset_tag, serial_number, asset_type, make, model, assigned_to, gaid, email_id, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, monitor1_asset_tag, monitor1_serial_number, monitor2_asset_tag, monitor2_serial_number, headset_asset_tag, headset_serial_number, yubikey_number, webcam_number, reporting_manager, manager_email_id];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, ...req.body }
        });
    });
});

// Bulk Upload Assets from CSV
router.post('/bulk-upload', async (req, res) => {
    if (!req.body.csvData) {
        return res.status(400).json({ error: "No CSV data provided." });
    }

    const csvData = req.body.csvData;
    const results = [];
    const errors = [];

    const s = new Readable();
    s.push(csvData);
    s.push(null); // Mark the end of the stream

    s.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            if (results.length === 0) {
                return res.status(400).json({ error: "CSV file is empty or malformed." });
            }

            db.serialize(() => {
                db.run("BEGIN TRANSACTION;");
                const stmt = db.prepare('INSERT INTO assets (asset_tag, serial_number, asset_type, make, model, assigned_to, gaid, email_id, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, monitor1_asset_tag, monitor1_serial_number, monitor2_asset_tag, monitor2_serial_number, headset_asset_tag, headset_serial_number, yubikey_number, webcam_number, reporting_manager, manager_email_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');

                for (const row of results) {
                    const asset = {
                        asset_tag: row['asset_tag'] || '',
                        serial_number: row['serial_number'] || '',
                        asset_type: row['asset_type'] || '',
                        make: row['make'] || '',
                        model: row['model'] || '',
                        assigned_to: row['assigned_to'] || '',
                        gaid: row['gaid'] || '',
                        email_id: row['email_id'] || '',
                        status: row['status'] || 'In Stock',
                        cpu: row['cpu'] || '',
                        ram: row['ram'] || '',
                        storage: row['storage'] || '',
                        purchase_date: row['purchase_date'] || '',
                        warranty_expiration_date: row['warranty_expiration_date'] || '',
                        notes: row['notes'] || '',
                        monitor1_asset_tag: row['monitor1_asset_tag'] || '',
                        monitor1_serial_number: row['monitor1_serial_number'] || '',
                        monitor2_asset_tag: row['monitor2_asset_tag'] || '',
                        monitor2_serial_number: row['monitor2_serial_number'] || '',
                        headset_asset_tag: row['headset_asset_tag'] || '',
                        headset_serial_number: row['headset_serial_number'] || '',
                        yubikey_number: row['yubikey_number'] || '',
                        webcam_number: row['webcam_number'] || '',
                        reporting_manager: row['reporting_manager'] || '',
                        manager_email_id: row['manager_email_id'] || '',
                    };

                    const validation = validateAsset(asset);
                    if (!validation.isValid) {
                        errors.push(`Row with Asset Tag '${asset.asset_tag || 'N/A'}' failed validation: ${validation.message}`);
                        continue; // Skip invalid row
                    }

                    const params = [
                        asset.asset_tag, asset.serial_number, asset.asset_type, asset.make, asset.model,
                        asset.assigned_to, asset.gaid, asset.email_id, asset.status, asset.cpu, asset.ram,
                        asset.storage, asset.purchase_date, asset.warranty_expiration_date, asset.notes,
                        asset.monitor1_asset_tag, asset.monitor1_serial_number, asset.monitor2_asset_tag,
                        asset.monitor2_serial_number, asset.headset_asset_tag, asset.headset_serial_number,
                        asset.yubikey_number, asset.webcam_number, asset.reporting_manager, asset.manager_email_id
                    ];

                    stmt.run(params, function (err) {
                        if (err) {
                            errors.push(`Error inserting asset '${asset.asset_tag}': ${err.message}`);
                        }
                    });
                }

                stmt.finalize();

                db.run("COMMIT;", (err) => {
                    if (err) {
                        errors.push(`Transaction commit failed: ${err.message}`);
                        db.run("ROLLBACK;");
                        return res.status(500).json({ error: "Bulk upload failed due to transaction error.", details: errors });
                    }
                    if (errors.length > 0) {
                        return res.status(400).json({ message: "Bulk upload completed with some errors.", errors: errors });
                    }
                    res.json({ message: "Bulk upload successful!" });
                });
            });
        })
        .on('error', (err) => {
            res.status(500).json({ error: "Failed to parse CSV data.", details: err.message });
        });
});

// PUT (Update) an existing asset
router.put('/:id', (req, res) => {
    const { isValid, message } = validateAsset(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { asset_tag, serial_number, asset_type, make, model, assigned_to, gaid, email_id, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, monitor1_asset_tag, monitor1_serial_number, monitor2_asset_tag, monitor2_serial_number, headset_asset_tag, headset_serial_number, yubikey_number, webcam_number, reporting_manager, manager_email_id } = req.body;
    const sql = 'UPDATE assets SET asset_tag = ?, serial_number = ?, asset_type = ?, make = ?, model = ?, assigned_to = ?, gaid = ?, email_id = ?, status = ?, cpu = ?, ram = ?, storage = ?, purchase_date = ?, warranty_expiration_date = ?, notes = ?, monitor1_asset_tag = ?, monitor1_serial_number = ?, monitor2_asset_tag = ?, monitor2_serial_number = ?, headset_asset_tag = ?, headset_serial_number = ?, yubikey_number = ?, webcam_number = ?, reporting_manager = ?, manager_email_id = ? WHERE id = ?';
    const params = [asset_tag, serial_number, asset_type, make, model, assigned_to, gaid, email_id, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, monitor1_asset_tag, monitor1_serial_number, monitor2_asset_tag, monitor2_serial_number, headset_asset_tag, headset_serial_number, yubikey_number, webcam_number, reporting_manager, manager_email_id, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({
            message: "success",
            data: { id: req.params.id, changes: this.changes, ...req.body }
        });
    });
});

// DELETE an asset
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM assets WHERE id = ?';
    const params = [req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({"message":"deleted", changes: this.changes});
    });
});

// Offboard an employee's assets
router.post('/offboard', (req, res) => {
    const { gaid } = req.body;
    if (!gaid) {
        return res.status(400).json({ "error": "GAID is required." });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        const findSql = "SELECT * FROM assets WHERE gaid = ?";
        db.all(findSql, [gaid], (err, primaryAssets) => {
            if (err) {
                db.run("ROLLBACK;");
                return res.status(500).json({ "error": `Failed to find assets: ${err.message}` });
            }

            if (primaryAssets.length === 0) {
                db.run("ROLLBACK;");
                return res.status(404).json({ "message": `No assets found for GAID: ${gaid}` });
            }

            const actions = [];

            primaryAssets.forEach(asset => {
                // Queue peripherals to be created as new assets
                if (asset.monitor1_asset_tag) {
                    actions.push(db.prepare('INSERT INTO assets (asset_tag, serial_number, asset_type, status) VALUES (?, ?, ?, ?)', [asset.monitor1_asset_tag, asset.monitor1_serial_number, 'Monitor', 'In Stock']));
                }
                if (asset.monitor2_asset_tag) {
                    actions.push(db.prepare('INSERT INTO assets (asset_tag, serial_number, asset_type, status) VALUES (?, ?, ?, ?)', [asset.monitor2_asset_tag, asset.monitor2_serial_number, 'Monitor', 'In Stock']));
                }
                if (asset.headset_asset_tag) {
                    actions.push(db.prepare('INSERT INTO assets (asset_tag, serial_number, asset_type, status) VALUES (?, ?, ?, ?)', [asset.headset_asset_tag, asset.headset_serial_number, 'Headset', 'In Stock']));
                }

                // Queue the primary asset to be updated
                const updateSql = `UPDATE assets SET
                    status = 'In Stock', assigned_to = '', email_id = '', gaid = '',
                    monitor1_asset_tag = '', monitor1_serial_number = '',
                    monitor2_asset_tag = '', monitor2_serial_number = '',
                    headset_asset_tag = '', headset_serial_number = '',
                    yubikey_number = '', webcam_number = ''
                WHERE id = ?`;
                actions.push(db.prepare(updateSql, [asset.id]));
            });

            let executed = 0;
            actions.forEach(action => {
                action.run(function(err) {
                    executed++;
                    if (err) {
                        db.run("ROLLBACK;");
                        if (!res.headersSent) {
                            res.status(500).json({ error: `Transaction failed: ${err.message}` });
                        }
                        return;
                    }
                    if (executed === actions.length) {
                        db.run("COMMIT;", (commitErr) => {
                            if (commitErr) {
                                if (!res.headersSent) {
                                    res.status(500).json({ error: `Commit failed: ${commitErr.message}` });
                                }
                                return;
                            }
                            res.json({ message: `Successfully off-boarded assets for GAID: ${gaid}.` });
                        });
                    }
                });
            });
        });
    });
});

module.exports = router;



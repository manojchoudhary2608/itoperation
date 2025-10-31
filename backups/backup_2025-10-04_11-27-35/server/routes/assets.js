
const express = require('express');
const router = express.Router();
const db = require('../database');

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

    const { asset_tag, serial_number, asset_type, make, model, assigned_to, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes } = req.body;
    const sql = 'INSERT INTO assets (asset_tag, serial_number, asset_type, make, model, assigned_to, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
    const params = [asset_tag, serial_number, asset_type, make, model, assigned_to, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes];
    
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

// PUT (Update) an existing asset
router.put('/:id', (req, res) => {
    const { isValid, message } = validateAsset(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { asset_tag, serial_number, asset_type, make, model, assigned_to, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes } = req.body;
    const sql = 'UPDATE assets SET asset_tag = ?, serial_number = ?, asset_type = ?, make = ?, model = ?, assigned_to = ?, status = ?, cpu = ?, ram = ?, storage = ?, purchase_date = ?, warranty_expiration_date = ?, notes = ? WHERE id = ?';
    const params = [asset_tag, serial_number, asset_type, make, model, assigned_to, status, cpu, ram, storage, purchase_date, warranty_expiration_date, notes, req.params.id];

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

module.exports = router;

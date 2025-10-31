const express = require('express');
const router = express.Router();
const db = require('../database');
const { sendDeliveryTrackerEmail } = require('../emailService');

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
const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper function to validate stock data
const validateStock = (stock) => {
    if (!stock.item_name || stock.purchase_qty === undefined || stock.assign_qty === undefined || stock.stock_balance === undefined) {
        return { isValid: false, message: "Item Name, Purchase Quantity, Assign Quantity, and Stock Balance are required." };
    }
    return { isValid: true };
};

// GET all stock items
router.get('/', (req, res) => {
    const sql = "SELECT * FROM stock";
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

// GET a single stock item by id
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM stock WHERE id = ?";
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

// POST a new stock item
router.post('/', (req, res) => {
    const { isValid, message } = validateStock(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { item_name, purchase_qty, assign_qty, stock_balance } = req.body;
    const sql = 'INSERT INTO stock (item_name, purchase_qty, assign_qty, stock_balance) VALUES (?,?,?,?)';
    const params = [item_name, purchase_qty, assign_qty, stock_balance];
    
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

// PUT (Update) an existing stock item
router.put('/:id', (req, res) => {
    const { isValid, message } = validateStock(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { item_name, purchase_qty, assign_qty, stock_balance } = req.body;
    const sql = 'UPDATE stock SET item_name = ?, purchase_qty = ?, assign_qty = ?, stock_balance = ? WHERE id = ?';
    const params = [item_name, purchase_qty, assign_qty, stock_balance, req.params.id];

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

// DELETE a stock item
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM stock WHERE id = ?';
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
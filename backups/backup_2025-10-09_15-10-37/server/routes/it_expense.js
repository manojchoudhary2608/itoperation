const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper function to validate IT expense data
const validateItExpense = (expense) => {
    if (!expense.vendor_name || !expense.invoice_number || !expense.item || expense.quantity === undefined || expense.price === undefined || expense.tax_percentage === undefined || expense.amount === undefined || !expense.date || !expense.invoice) {
        return { isValid: false, message: "Vendor Name, Invoice Number, Item, Quantity, Price, Tax (%), Amount, Date, and Invoice are required." };
    }
    return { isValid: true };
};

// GET all IT expenses
router.get('/', (req, res) => {
    const sql = "SELECT * FROM it_expenses";
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

// GET a single IT expense by id
router.get('/:id', (req, res) => {
    const sql = "SELECT * FROM it_expenses WHERE id = ?";
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

// POST a new IT expense
router.post('/', (req, res) => {
    const { isValid, message } = validateItExpense(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { vendor_name, invoice_number, item, quantity, price, tax_percentage, amount, date, invoice } = req.body;
    const sql = 'INSERT INTO it_expenses (vendor_name, invoice_number, item, quantity, price, tax_percentage, amount, date, invoice) VALUES (?,?,?,?,?,?,?,?,?)';
    const params = [vendor_name, invoice_number, item, quantity, price, tax_percentage, amount, date, invoice];
    
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

// PUT (Update) an existing IT expense
router.put('/:id', (req, res) => {
    const { isValid, message } = validateItExpense(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { vendor_name, invoice_number, item, quantity, price, tax_percentage, amount, date, invoice } = req.body;
    const sql = 'UPDATE it_expenses SET vendor_name = ?, invoice_number = ?, item = ?, quantity = ?, price = ?, tax_percentage = ?, amount = ?, date = ?, invoice = ? WHERE id = ?';
    const params = [vendor_name, invoice_number, item, quantity, price, tax_percentage, amount, date, invoice, req.params.id];

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

// DELETE an IT expense
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM it_expenses WHERE id = ?';
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
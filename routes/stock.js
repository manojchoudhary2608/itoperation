const express = require('express');
const router = express.Router();
const db = require('../database');
const fs = require('fs'); // Import file system module
const path = require('path'); // Import path module

// Helper function to validate stock data
const validateStock = (stock) => {
    if (!stock.item_name || stock.purchase_qty === undefined || stock.assign_qty === undefined) {
        return { isValid: false, message: "Item Name, Purchase Quantity, and Assign Quantity are required." };
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

// GET distinct item names
router.get('/item-names', (req, res) => {
    const sql = "SELECT DISTINCT item_name FROM stock ORDER BY item_name";
    db.all(sql, [], (err, rows) => {
        console.log("DB Query for /item-names - Error:", err);
        console.log("DB Query for /item-names - Rows:", rows);
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }
        res.json({
            "message":"success",
            "data": rows ? rows.map(row => row.item_name) : [] // Ensure data is always an array
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

    const { item_name, purchase_qty, assign_qty } = req.body;
    const calculated_stock_balance = purchase_qty - assign_qty;
    const sql = 'INSERT INTO stock (item_name, purchase_qty, assign_qty, stock_balance) VALUES (?,?,?,?)';
    const params = [item_name, purchase_qty, assign_qty, calculated_stock_balance];
    
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

    const { item_name, purchase_qty, assign_qty } = req.body;
    const calculated_stock_balance = purchase_qty - assign_qty;
    const sql = 'UPDATE stock SET item_name = ?, purchase_qty = ?, assign_qty = ?, stock_balance = ? WHERE id = ?';
    const params = [item_name, purchase_qty, assign_qty, calculated_stock_balance, req.params.id];

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

// POST bulk upload stock items from CSV
router.post('/bulk-upload', (req, res) => {
    const { csvData } = req.body;
    if (!csvData) {
        return res.status(400).json({ error: "CSV data is required." });
    }

    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        return res.status(400).json({ error: "CSV data is empty." });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['item_name', 'purchase_qty', 'assign_qty'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
        return res.status(400).json({ error: `Missing required CSV headers: ${missingHeaders.join(', ')}` });
    }

    const results = [];
    const errors = [];

    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index];
            });

            const { item_name, purchase_qty, assign_qty } = rowData;

            // Basic validation
            if (!item_name || isNaN(purchase_qty) || isNaN(assign_qty)) {
                errors.push(`Row ${i + 1}: Invalid data - item_name, purchase_qty, and assign_qty are required and must be valid numbers.`);
                continue;
            }

            const parsed_purchase_qty = parseInt(purchase_qty);
            const parsed_assign_qty = parseInt(assign_qty);
            const calculated_stock_balance = parsed_purchase_qty - parsed_assign_qty;

            const sql = 'INSERT INTO stock (item_name, purchase_qty, assign_qty, stock_balance) VALUES (?,?,?,?)';
            const params = [item_name, parsed_purchase_qty, parsed_assign_qty, calculated_stock_balance];

            db.run(sql, params, function (err) {
                if (err) {
                    errors.push(`Row ${i + 1}: Database error - ${err.message}`);
                } else {
                    results.push({ id: this.lastID, ...rowData, stock_balance: calculated_stock_balance });
                }
            });
        }

        if (errors.length > 0) {
            db.run("ROLLBACK;");
            return res.status(400).json({ message: "Bulk upload failed with errors.", errors });
        } else {
            db.run("COMMIT;", (commitErr) => {
                if (commitErr) {
                    return res.status(500).json({ error: `Transaction commit failed: ${commitErr.message}` });
                }

                // Save the CSV file to the root folder
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `stock_bulk_upload_${timestamp}.csv`;
                const filePath = path.join(__dirname, '..', '..', filename); // Go up two levels to the root

                fs.writeFile(filePath, csvData, (fileErr) => {
                    if (fileErr) {
                        console.error("Error saving uploaded CSV file:", fileErr);
                        // Continue with success response even if file save fails, as DB is updated
                    } else {
                        console.log(`Uploaded CSV saved to ${filePath}`);
                    }
                    res.json({ message: "Bulk upload successful!", results });
                });
            });
        }
    });
});

module.exports = router;
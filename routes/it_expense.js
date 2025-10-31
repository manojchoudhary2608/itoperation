const express = require('express');
const router = express.Router();
const db = require('../database');
const fs = require('fs'); // Import file system module
const path = require('path'); // Import path module
const axios = require('axios'); // Import axios

// Helper function to validate IT expense data
const validateItExpense = (invoiceData) => {
    if (!invoiceData.vendor_name || !invoiceData.invoice_number || !invoiceData.invoice_date) {
        return { isValid: false, message: "Vendor Name, Invoice Number, and Invoice Date are required for the invoice." };
    }
    if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
        return { isValid: false, message: "At least one item is required for the invoice." };
    }
    for (const item of invoiceData.items) {
        if (!item.item_name || item.quantity === undefined || item.price === undefined || item.tax_percentage === undefined) {
            return { isValid: false, message: "Item Name, Quantity, Price, and Tax (%) are required for each item." };
        }
        if (item.quantity <= 0 || item.price < 0 || item.tax_percentage < 0) {
            return { isValid: false, message: "Quantity must be positive, Price and Tax (%) cannot be negative." };
        }
    }
    return { isValid: true };
};

// GET all IT expenses with their items
router.get('/', (req, res) => {
    const sql = `
        SELECT
            i.id AS invoice_id,
            i.vendor_name,
            i.invoice_number,
            i.invoice_date,
            i.total_amount,
            i.total_amount_usd,
            i.invoice_file_path,
            ii.id AS item_id,
            ii.item_name,
            ii.quantity,
            ii.price,
            ii.tax_percentage,
            ii.item_amount
        FROM invoices i
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        ORDER BY i.invoice_date DESC, i.id, ii.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }

        const invoicesMap = new Map();
        rows.forEach(row => {
            if (!invoicesMap.has(row.invoice_id)) {
                invoicesMap.set(row.invoice_id, {
                    id: row.invoice_id,
                    vendor_name: row.vendor_name,
                    invoice_number: row.invoice_number,
                    invoice_date: row.invoice_date,
                    total_amount: row.total_amount,
                    total_amount_usd: row.total_amount_usd,
                    invoice_file_path: row.invoice_file_path,
                    items: []
                });
            }
            if (row.item_id) { // Only add item if it exists
                invoicesMap.get(row.invoice_id).items.push({
                    id: row.item_id,
                    item_name: row.item_name,
                    quantity: row.quantity,
                    price: row.price,
                    tax_percentage: row.tax_percentage,
                    item_amount: row.item_amount
                });
            }
        });

        res.json({
            "message":"success",
            "data": Array.from(invoicesMap.values())
        });
    });
});

// GET a single IT expense (invoice) by id with its items
router.get('/:id', (req, res) => {
    const sql = `
        SELECT
            i.id AS invoice_id,
            i.vendor_name,
            i.invoice_number,
            i.invoice_date,
            i.total_amount,
            i.total_amount_usd,
            i.invoice_file_path,
            ii.id AS item_id,
            ii.item_name,
            ii.quantity,
            ii.price,
            ii.tax_percentage,
            ii.item_amount
        FROM invoices i
        LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.id = ?
        ORDER BY ii.id
    `;
    const params = [req.params.id];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({"error":err.message});
            return;
        }

        if (rows.length === 0) {
            res.status(404).json({"message":"Invoice not found"});
            return;
        }

        const invoice = {
            id: rows[0].invoice_id,
            vendor_name: rows[0].vendor_name,
            invoice_number: rows[0].invoice_number,
            invoice_date: rows[0].invoice_date,
            total_amount: rows[0].total_amount,
            total_amount_usd: rows[0].total_amount_usd,
            invoice_file_path: rows[0].invoice_file_path,
            items: []
        };

        rows.forEach(row => {
            if (row.item_id) { // Only add item if it exists
                invoice.items.push({
                    id: row.item_id,
                    item_name: row.item_name,
                    quantity: row.quantity,
                    price: row.price,
                    tax_percentage: row.tax_percentage,
                    item_amount: row.item_amount
                });
            }
        });

        res.json({
            "message":"success",
            "data": invoice
        });
    });
});

// POST a new IT expense (invoice) with items and optional file upload
router.post('/', async (req, res) => {
    const { isValid, message } = validateItExpense(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const { vendor_name, invoice_number, invoice_date, items, invoice_file_base64, invoice_file_name } = req.body;

    // Calculate total amount in INR
    let total_amount = 0;
    items.forEach(item => {
        const item_amount = item.quantity * item.price * (1 + item.tax_percentage / 100);
        total_amount += item_amount;
    });

    let total_amount_usd = 0;
    try {
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        const inrRate = response.data.rates.INR;
        if (inrRate) {
            total_amount_usd = total_amount / inrRate;
        }
    } catch (error) {
        console.error('Failed to fetch exchange rate', error);
        // Decide if you want to proceed without the USD amount or return an error
    }


    let invoice_file_path = null;
    if (invoice_file_base64 && invoice_file_name) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const uniqueFileName = `${Date.now()}-${invoice_file_name}`;
        invoice_file_path = path.join(uploadsDir, uniqueFileName);
        const buffer = Buffer.from(invoice_file_base64, 'base64');
        fs.writeFileSync(invoice_file_path, buffer);
    }

    db.run("BEGIN TRANSACTION;");

    const insertInvoiceSql = 'INSERT INTO invoices (vendor_name, invoice_number, invoice_date, total_amount, total_amount_usd, invoice_file_path) VALUES (?,?,?,?,?,?)';
    const insertInvoiceParams = [vendor_name, invoice_number, invoice_date, total_amount, total_amount_usd, invoice_file_path];

    db.run(insertInvoiceSql, insertInvoiceParams, function (err) {
        if (err) {
            db.run("ROLLBACK;");
            res.status(400).json({"error": err.message});
            return;
        }
        const invoice_id = this.lastID;

        if (items.length === 0) {
            db.run("COMMIT;", (commitErr) => {
                if (commitErr) {
                    res.status(500).json({ "error": commitErr.message });
                    return;
                }
                res.json({
                    "message": "success",
                    "data": { id: invoice_id, ...req.body, total_amount, total_amount_usd, invoice_file_path }
                });
            });
            return;
        }

        const insertItemSql = 'INSERT INTO invoice_items (invoice_id, item_name, quantity, price, tax_percentage, item_amount) VALUES (?,?,?,?,?,?)';
        let itemsInserted = 0;
        items.forEach(item => {
            const item_amount = item.quantity * item.price * (1 + item.tax_percentage / 100);
            const insertItemParams = [invoice_id, item.item_name, item.quantity, item.price, item.tax_percentage, item_amount];
            db.run(insertItemSql, insertItemParams, (err) => {
                if (err) {
                    db.run("ROLLBACK;");
                    res.status(400).json({"error": err.message});
                    return;
                }
                itemsInserted++;
                if (itemsInserted === items.length) {
                    db.run("COMMIT;", (commitErr) => {
                        if (commitErr) {
                            res.status(500).json({ "error": commitErr.message });
                            return;
                        }
                        res.json({
                            "message": "success",
                            "data": { id: invoice_id, ...req.body, total_amount, total_amount_usd, invoice_file_path }
                        });
                    });
                }
            });
        });
    });
});

// PUT (Update) an existing IT expense (invoice) with items and optional file upload
router.put('/:id', async (req, res) => {
    const { isValid, message } = validateItExpense(req.body);
    if (!isValid) {
        res.status(400).json({ "error": message });
        return;
    }

    const invoice_id = req.params.id;
    const { vendor_name, invoice_number, invoice_date, items, invoice_file_base64, invoice_file_name } = req.body;

    // Calculate total amount in INR
    let total_amount = 0;
    items.forEach(item => {
        const item_amount = item.quantity * item.price * (1 + item.tax_percentage / 100);
        total_amount += item_amount;
    });

    let total_amount_usd = 0;
    try {
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        const inrRate = response.data.rates.INR;
        if (inrRate) {
            total_amount_usd = total_amount / inrRate;
        }
    } catch (error) {
        console.error('Failed to fetch exchange rate', error);
        // Decide if you want to proceed without the USD amount or return an error
    }

    let invoice_file_path = null;
    if (invoice_file_base64 && invoice_file_name) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const uniqueFileName = `${Date.now()}-${invoice_file_name}`;
        invoice_file_path = path.join(uploadsDir, uniqueFileName);
        const buffer = Buffer.from(invoice_file_base64, 'base64');
        fs.writeFileSync(invoice_file_path, buffer);

        // Optionally, delete old invoice file if it exists
        db.get('SELECT invoice_file_path FROM invoices WHERE id = ?', [invoice_id], (err, row) => {
            if (row && row.invoice_file_path && fs.existsSync(row.invoice_file_path)) {
                fs.unlinkSync(row.invoice_file_path);
            }
        });
    }

    db.run("BEGIN TRANSACTION;");

    const updateInvoiceSql = 'UPDATE invoices SET vendor_name = ?, invoice_number = ?, invoice_date = ?, total_amount = ?, total_amount_usd = ?, invoice_file_path = COALESCE(?, invoice_file_path) WHERE id = ?';
    const updateInvoiceParams = [vendor_name, invoice_number, invoice_date, total_amount, total_amount_usd, invoice_file_path, invoice_id];

    db.run(updateInvoiceSql, updateInvoiceParams, function (err) {
        if (err) {
            db.run("ROLLBACK;");
            res.status(400).json({"error": err.message});
            return;
        }

        // Delete existing items for this invoice
        db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [invoice_id], (err) => {
            if (err) {
                db.run("ROLLBACK;");
                res.status(400).json({"error": err.message});
                return;
            }

            const insertItemSql = 'INSERT INTO invoice_items (invoice_id, item_name, quantity, price, tax_percentage, item_amount) VALUES (?,?,?,?,?,?)';
            let itemsInserted = 0;
            items.forEach(item => {
                const item_amount = item.quantity * item.price * (1 + item.tax_percentage / 100);
                const insertItemParams = [invoice_id, item.item_name, item.quantity, item.price, item.tax_percentage, item_amount];
                db.run(insertItemSql, insertItemParams, (err) => {
                    if (err) {
                        db.run("ROLLBACK;");
                        res.status(400).json({"error": err.message});
                        return;
                    }
                    itemsInserted++;
                    if (itemsInserted === items.length) {
                        db.run("COMMIT;", (commitErr) => {
                            if (commitErr) {
                                res.status(500).json({ "error": commitErr.message });
                                return;
                            }
                            res.json({
                                "message": "success",
                                "data": { id: invoice_id, ...req.body, total_amount, total_amount_usd, invoice_file_path }
                            });
                        });
                    }
                });
            });
        });
    });
});

// DELETE an IT expense (invoice) and its associated file
router.delete('/:id', (req, res) => {
    const invoice_id = req.params.id;

    db.get('SELECT invoice_file_path FROM invoices WHERE id = ?', [invoice_id], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }

        const invoice_file_path = row ? row.invoice_file_path : null;

        db.run('DELETE FROM invoices WHERE id = ?', [invoice_id], function (err) {
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            if (this.changes > 0) {
                // If invoice was deleted, try to delete the file
                if (invoice_file_path && fs.existsSync(invoice_file_path)) {
                    fs.unlink(invoice_file_path, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Error deleting invoice file:", unlinkErr);
                        }
                    });
                }
                res.json({"message":"Invoice deleted", changes: this.changes});
            } else {
                res.status(404).json({"message":"Invoice not found"});
            }
        });
    });
});

module.exports = router;

// GET route to download invoice file
router.get('/download/:id', (req, res) => {
    const invoice_id = req.params.id;
    db.get('SELECT invoice_file_path FROM invoices WHERE id = ?', [invoice_id], (err, row) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        if (!row || !row.invoice_file_path) {
            res.status(404).json({"message":"Invoice file not found"});
            return;
        }

        const filePath = row.invoice_file_path;
        if (fs.existsSync(filePath)) {
            res.download(filePath, (downloadErr) => {
                if (downloadErr) {
                    console.error("Error downloading file:", downloadErr);
                    res.status(500).json({"error":"Error downloading file"});
                }
            });
        } else {
            res.status(404).json({"message":"Invoice file not found on server"});
        }
    });
});

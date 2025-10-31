
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DBSOURCE = "database.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        db.serialize(() => {
            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT
            )`, (err) => {
                if (err) {
                    // Table already created
                } else {
                    // Table just created, creating a new user
                    const salt = bcrypt.genSaltSync(10);
                    const hashedPassword = bcrypt.hashSync("admin", salt);
                    const insert = 'INSERT INTO users (username, password, role) VALUES (?,?,?)';
                    db.run(insert, ["admin", hashedPassword, "Administrator"], (err) => {
                        if (err) {
                            // User already exists
                        }
                        console.log("Admin user created");
                    });
                }
            });

            // Create assets table
            db.run(`CREATE TABLE IF NOT EXISTS assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_tag TEXT NOT NULL UNIQUE,
                serial_number TEXT,
                asset_type TEXT NOT NULL,
                make TEXT,
                model TEXT,
                assigned_to TEXT,
                gaid TEXT,
                email_id TEXT,
                status TEXT NOT NULL,
                cpu TEXT,
                ram TEXT,
                storage TEXT,
                purchase_date TEXT,
                warranty_expiration_date TEXT,
                notes TEXT,
                monitor1_asset_tag TEXT,
                monitor1_serial_number TEXT,
                monitor2_asset_tag TEXT,
                monitor2_serial_number TEXT,
                headset_asset_tag TEXT,
                headset_serial_number TEXT,
                yubikey_number TEXT,
                            webcam_number TEXT,
                            reporting_manager TEXT,
                            manager_email_id TEXT
                        )`);
            // Create stock table
            db.run(`CREATE TABLE IF NOT EXISTS stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                purchase_qty INTEGER NOT NULL,
                assign_qty INTEGER NOT NULL,
                stock_balance INTEGER NOT NULL
            )`);

            // Create it_expenses table
            db.run(`CREATE TABLE IF NOT EXISTS it_expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_name TEXT NOT NULL,
                invoice_number TEXT NOT NULL,
                item TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                tax_percentage REAL NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                invoice TEXT NOT NULL
            )`);

            // Create deliveries table
            db.run(`CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                mobile_number TEXT NOT NULL,
                courier_partner TEXT NOT NULL,
                tracking_number TEXT NOT NULL,
                courier_date TEXT NOT NULL,
                it_status TEXT NOT NULL,
                final_status TEXT NOT NULL,
                delivery_date TEXT NOT NULL,
                new_joiner TEXT NOT NULL
            )`);

            // Check and add GAID column to assets table if it doesn't exist (legacy migration)
            db.all(`PRAGMA table_info(assets)`, (err, columns) => {
                if (err) {
                    console.error("Error checking assets table info:", err.message);
                    return;
                }
                const gaidExists = columns.some(col => col.name === 'gaid');
                if (!gaidExists) {
                    db.run(`ALTER TABLE assets ADD COLUMN gaid TEXT`, (err) => {
                        if (err) {
                            console.error("Error adding gaid column to assets table:", err.message);
                        } else {
                            console.log("GAID column added to assets table");
                        }
                    });
                }
            });
        });
    }
});
module.exports = db;

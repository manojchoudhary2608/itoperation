
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DBSOURCE = "C:\\Users\\312903\\Documents\\IT Connect\\IT Operations Portal\\server\\database.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.exec("PRAGMA encoding = 'UTF-8';");

        db.serialize(() => {
            // Add permissions column to users table if it doesn't exist
            db.run(`ALTER TABLE users ADD COLUMN permissions TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error("Error adding permissions column:", err.message);
                }
            });

            // Create admin user if not exists
            db.get(`SELECT * FROM users WHERE username = ?`, ['admin'], (err, row) => {
                if (!row) {
                    const salt = bcrypt.genSaltSync(10);
                    const hashedPassword = bcrypt.hashSync("admin", salt);
                    const insert = 'INSERT INTO users (username, password, role) VALUES (?,?,?)';
                    db.run(insert, ["admin", hashedPassword, "Administrator"]);
                }
            });

            // Set default permissions for admin user
            const defaultAdminPermissions = JSON.stringify({
                assets: true,
                stock: true,
                it_expenses: true,
                deliveries: true,
                offboarding: true,
                new_hire: true,
                user_management: true
            });
            db.run(`UPDATE users SET permissions = ? WHERE username = ?`, [defaultAdminPermissions, 'admin']);

            // Create other tables
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
            db.run(`CREATE TABLE IF NOT EXISTS stock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                purchase_qty INTEGER NOT NULL,
                assign_qty INTEGER NOT NULL,
                stock_balance INTEGER NOT NULL
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_number TEXT NOT NULL UNIQUE,
                vendor_name TEXT NOT NULL,
                invoice_date TEXT NOT NULL,
                total_amount REAL NOT NULL,
                invoice_file_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                tax_percentage REAL NOT NULL,
                item_amount REAL NOT NULL,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
            )`);
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
            db.run(`CREATE TABLE IF NOT EXISTS new_hires (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                mobile_number TEXT,
                date_of_joining TEXT,
                status TEXT,
                created_at DATETIME
            )`);
            db.run(`ALTER TABLE new_hires ADD COLUMN created_at DATETIME`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error("Error adding created_at column to new_hires:", err.message);
                }
            });
            db.run(`ALTER TABLE new_hires ADD COLUMN added_by TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error("Error adding added_by column to new_hires:", err.message);
                }
            });
            db.run(`CREATE TABLE IF NOT EXISTS asset_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                user TEXT NOT NULL,
                action TEXT NOT NULL,
                field TEXT,
                old_value TEXT,
                new_value TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);


        });
    }
});
module.exports = db;


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
                    asset_tag TEXT UNIQUE NOT NULL,
                    serial_number TEXT UNIQUE,
                    asset_type TEXT NOT NULL,
                    make TEXT,
                    model TEXT,
                    assigned_to TEXT,
                    status TEXT NOT NULL,
                    cpu TEXT,
                    ram TEXT,
                    storage TEXT,
                    purchase_date TEXT,
                    warranty_expiration_date TEXT,
                    notes TEXT
                )`, (err) => {
                    if (err) {
                        // Table already created
                    } else {
                        console.log("Assets table created");
                    }
                });
            }
        });
module.exports = db;

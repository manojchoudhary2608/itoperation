
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path"); // Import path module
const db = require("./database.js");
const assetsRouter = require("./routes/assets"); // Import assets router
const stockRoutes = require('./routes/stock');
const itExpenseRoutes = require('./routes/it_expense');
const deliveryTrackerRoutes = require('./routes/delivery_tracker');
const newHireRoutes = require('./routes/new_hire');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mount assets router
app.use('/api/assets', assetsRouter);
app.use('/api/stock', stockRoutes);
app.use('/api/it_expenses', itExpenseRoutes);
app.use('/api/deliveries', deliveryTrackerRoutes);
app.use('/api/new_hires', newHireRoutes);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = "your_jwt_secret_key"; // In a real app, use an environment variable

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        if (!user) {
            return res.status(400).json({ "error": "User not found" });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ "error": "Invalid Password!" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({ 
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken: token 
        });
    });
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

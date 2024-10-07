const express = require('express');
const app = express();
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS
app.use(cors({
    origin: 'http://localhost:3301', // Adjust origin if needed
    credentials: true
}));

// Setting up session management
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false, // Prevents storing unmodified sessions
    cookie: {
        secure: false, // Set to `true` in production with HTTPS
        httpOnly: true // Helps protect against XSS attacks
    }
}));

// Serve static files from the 'public' directory
app.use(express.static(
    path.join(__dirname, 'public')
));

// Middleware for checking logged-in users
function isAuthenticated(req, res, next){
    if(req.session.user){
        return next();
    }
    res.status(401).send('Unauthorized');
}

// Creating a connection to the database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Checking the connection to the database
db.connect((err) => {
    if(err){
        return console.log('Error connecting to MySQL:', err.stack);
    }
    console.log('Connected successfully to MySQL with thread ID:', db.threadId);
});

// Routes for serving HTML files
app.get('/register', (req, res) =>{
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) =>{
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Registering new users
app.post('/register', async (req, res) =>{
    const { first_name, last_name, email, password, age, country, gender } = req.body;

    // Log the incoming request body for debugging
    console.log('Register Request Body:', req.body);

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        db.query(
            'INSERT INTO patients (first_name, last_name, email, password, age, country, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, password_hash, age, country, gender],
            (error, results) =>{
                if(error){
                    console.error('Error inserting user into database:', error);
                    return res.status(500).send('Error registering user');
                }
                res.status(201).send('User registered successfully');
            }
        );
    } catch (err) {
        console.error('Error hashing password:', err);
        res.status(500).send('Server error');
    }
});

// Patient Login
app.post('/login', (req, res) =>{
    const { email, password } = req.body;

    // Log the incoming request body for debugging
    console.log('Login Request Body:', req.body);

    // Validate required fields
    if (!email || !password) {
        return res.status(400).send('Missing email or password');
    }

    // Querying the database for the user
    db.query(
        'SELECT * FROM patients WHERE email = ?',
        [email],
        async (error, results) => {
            if(error){
                console.error('Error querying database:', error);
                return res.status(500).send('Server error');
            }
            if(results.length === 0){
                return res.status(401).send('Invalid email or password');
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password); // Ensure 'user.password' is the hashed password

            if (isMatch){
                // Store minimal user info in session
                req.session.user = {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                };

                console.log('Session set:', req.session);

                // Save the session before redirecting
                req.session.save((err) => {
                    if(err){
                        console.error('Error saving session:', err);
                        return res.status(500).send('Session error');
                    }
                    console.log('Session saved and redirecting');
                    res.redirect('/index.html'); // Redirect to the main page after successful login
                });
            } 
        }
    );
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/login'); // Redirect to login page after logout
    });
});

// Start the server
const port = 3301;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const csrf = require('csurf');

const app = express();
const PORT = 3001;

// Set up Pug as the templating engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // For static assets if needed

// Initialize SQLite database
const db = new sqlite3.Database('./vulnerable_database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT,
            content TEXT
        )`);
        // Insert some dummy data if tables are empty
        db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
            if (err) {
                console.error('Error checking users:', err.message);
            } else if (row.count === 0) {
                db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', ['admin', 'password123', 'admin@example.com']);
                db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', ['testuser', 'testpass', 'test@example.com']);
                console.log('Dummy users added.');
            }
        });
        db.get('SELECT COUNT(*) AS count FROM comments', (err, row) => {
            if (err) {
                console.error('Error checking comments:', err.message);
            } else if (row.count === 0) {
                db.run('INSERT INTO comments (author, content) VALUES (?, ?)', ['Alice', 'Hello, this is a comment!']);
                db.run('INSERT INTO comments (author, content) VALUES (?, ?)', ['Bob', 'Another comment here.']);
                console.log('Dummy comments added.');
            }
        });
    }
});

// --- ROUTES ---

// Home Page
app.get('/', (req, res) => {
    res.render('index', { title: 'Vulnerable App Home', message: 'Welcome to the intentionally vulnerable application!' });
});

// SQL Injection Vulnerability: User Search
app.get('/search', (req, res) => {
    res.render('search', { title: 'User Search', users: [], error: null });
});

app.post('/search', (req, res) => {
    const searchTerm = req.body.searchTerm;

    // VULNERABILITY: SQL Injection via direct string concatenation
    const query = "SELECT id, username, email FROM users WHERE username LIKE ?";
    const searchTermParam = `%${searchTerm}%`;

    db.all(query, [searchTermParam], (err, rows) => {
        if (err) {
            console.error('SQLi Search Error:', err.message);
            return res.render('search', { title: 'User Search', users: [], error: 'Database error. Try again.' });
        }
        res.render('search', { title: 'User Search Results', users: rows, error: null, searchTerm: searchTerm });
    });
});

// CSRF Vulnerability: Change Email Form
app.get('/profile', (req, res) => {
    res.render('profile', { title: 'User Profile', message: 'Change your email below.', csrfToken: req.csrfToken(), userEmail: 'user@example.com' });
});

const csrfProtection = csrf({ cookie: false });

app.post('/change-email', csrfProtection, (req, res) => {
    const newEmail = req.body.email;
    // VULNERABILITY: No CSRF token validation
    console.log(`Simulating email change for user to: ${newEmail}`);
    // In a real app, this would update the user's email in the database
    res.render('profile', { title: 'User Profile', message: `Email successfully changed to: ${newEmail} (simulated)!`, csrfToken: req.csrfToken(), userEmail: newEmail });
});


// XSS Vulnerability: Comment Section
app.get('/comments', (req, res) => {
    db.all('SELECT author, content FROM comments', [], (err, rows) => {
        if (err) {
            console.error('Comments Error:', err.message);
            return res.render('comments', { title: 'Comments', comments: [], error: 'Error loading comments.' });
        }
        res.render('comments', { title: 'Comments', comments: rows, error: null });
    });
});

app.post('/add-comment', (req, res) => {
    const author = req.body.author || 'Anonymous';
    const content = req.body.content;

    // VULNERABILITY: Stored XSS - content is stored and rendered without sanitization
    db.run('INSERT INTO comments (author, content) VALUES (?, ?)', [author, content], (err) => {
        if (err) {
            console.error('Add Comment Error:', err.message);
        }
        res.redirect('/comments');
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Vulnerable app listening at http://localhost:${PORT}`);
    console.log('SQL Injection vulnerability: POST /search');
    console.log('CSRF vulnerability: POST /change-email');
    console.log('XSS vulnerability: POST /add-comment (content displayed at GET /comments)');
});
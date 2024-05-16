const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
      origin: 'http://localhost:5173', // Client's origin
      methods: ['GET', 'POST']
    }
  });
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'g2'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit the process if connection fails
    } else {
        console.log('Connected to MySQL database!');
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Routes
app.post('/register', async (req, res) => {
    const { email, username, password } = req.body; // Include email field in request

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('INSERT INTO users (email, username, password) VALUES (?, ?, ?)', [email, username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            console.log('User registered:', result.insertId);
            res.json({ message: 'User registered successfully' });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) {
            console.error('Error retrieving user:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result[0];

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, 'secretKey');
        res.json({ token });
    });
});

// Authentication Middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, 'secretKey', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

// Protected Route
app.get('/dashboard', verifyToken, (req, res) => {
    res.json({ message: 'You are logged in' });
});

// User Routes
app.post('/users', (req, res) => {
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }
    const query = 'INSERT INTO users (username, email) VALUES (?, ?)';
    connection.query(query, [username, email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to Add User' });
        }
        res.json({ message: 'User Added Successfully' });
    });
});

app.get('/users', (req, res) => {
    const query = 'SELECT id, username, email FROM users'; // Select only necessary fields
    connection.query(query, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to Retrieve Users' });
        }
        res.json(rows);
    });
});

app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }
    const query = 'UPDATE users SET username=?, email=? WHERE id = ?';
    connection.query(query, [username, email, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to Update User' });
        }
        res.json({ message: 'User Updated Successfully' });
    });
});

// Spotify API credentials
const BEARER_TOKEN = 'BQCc49huu99x4_FcsiaWeqM_0VNvbMX6qlkNLAm9lG1u4NsD9Ydvp9sBVs-UP5rX2jj6bhjH8KRnpBo6QW-Az6u4S8kal7qW2VESjK0F6M-DdSik0pPubzy3D7MlTjrR3tt5ec4JA09WSXzEs-LxHuXzON3XLYTIQYufziugN5VxaQZtA9UgfSK82aPPveQG9TxgbLAsEYJJjCmrbe9r_SPO2-Hqm3Sh1ezdH8cIL2AobgqYa3tCxgvvJ7WvhqHaO_t7QZJ6W6Uj8uXmzrtwwnB5rLy1E-mzO03CoZO35pd9WYPI5EQlT_iYmM7rlppJp7wE2xThFUpGAEflN5B5f44';

// Route to handle search
app.get('/search', async (req, res) => {
    try {
        // Make a GET request to the Spotify API using the bearer token
        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`
            },
            params: {
                q: req.query.q,
                type: 'track'
            }
        });

        // Send the response received from Spotify API back to the client
        res.json(response.data);
    } catch (error) {
        // If there's an error, log it and send an internal server error response
        console.error('Error searching tracks on Spotify:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


io.on('connection', (socket) => {
    console.log('User connected');
  
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });


// express

server.listen(port, () => {
    console.log(`Socket.IO server is running on http://localhost:${port}`);
});
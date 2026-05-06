// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Mock database (Temporary, will reset when server restarts)
const users = []; 

// REGISTER ENDPOINT
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now().toString(), name, email, password: hashedPassword };
        users.push(newUser);

        // NOTE: We need a secret to sign the JWT. For local testing, we provide a fallback string.
        const secret = process.env.JWT_SECRET || 'super_secret_temporary_key_123';
        const token = jwt.sign({ userId: newUser.id }, secret, { expiresIn: '24h' });
        
        res.status(201).json({ token, user: { id: newUser.id, name, email } });
    } catch (error) {
        res.status(500).json({ message: "Server error during registration" });
    }
});

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const secret = process.env.JWT_SECRET || 'super_secret_temporary_key_123';
        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '24h' });
        
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error during login" });
    }
});

export default router;
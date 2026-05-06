// middleware/auth.js
import jwt from 'jsonwebtoken';

export default function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const secret = process.env.JWT_SECRET || 'super_secret_temporary_key_123';
jwt.verify(token, secret, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid or expired token." });
        req.user = user;
        next();
    });
}
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

// Register a new user
exports.register = (req, res) => {
    const { name, email, password, role, expertise } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    User.findByEmail(email, (err, user) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (user) return res.status(400).json({ message: 'Email already in use' });

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser = {
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        expertise: expertise || null
        };

        User.create(newUser, (err, createdUser) => {
        if (err) return res.status(500).json({ message: 'Error creating user' });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role
            }
        });
        });
    });
};
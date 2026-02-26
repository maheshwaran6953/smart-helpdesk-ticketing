const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

console.log('auth.controller loaded - bcrypt exists?', !!bcrypt);
console.log('auth.controller loaded - User model exists?', !!User);
if (User) {
console.log('User model has findByEmail?', typeof User.findByEmail === 'function');
}

exports.register = async (req, res) => {
    try {
    console.log('Entered register function');

    const { name, email, password, role, expertise } = req.body;
    console.log('Request body:', { name, email });

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = { name, email, password: hashedPassword, role: role || 'user', expertise: expertise || null };

    const createdUser = await User.create(newUser);

    res.status(201).json({
        message: 'User registered successfully',
        user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role
        }
    });
    } catch (error) {
    console.error('Registration error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
        message: 'Server error during registration',
        error: error.message || 'Unknown'
    });
    }
};
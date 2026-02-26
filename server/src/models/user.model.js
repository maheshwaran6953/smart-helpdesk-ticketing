const db = require('../config/db'); // now a promise pool

const User = {};

User.create = async (newUser) => {
try {
    const [result] = await db.execute(
    'INSERT INTO users (name, email, password, role, expertise) VALUES (?, ?, ?, ?, ?)',
    [
        newUser.name,
        newUser.email,
        newUser.password,
        newUser.role || 'user',
        newUser.expertise || null
    ]
    );
    console.log('User created with id:', result.insertId);
    return { id: result.insertId, ...newUser };
} catch (err) {
    console.error('Error creating user:', err);
    throw err;
}
};

User.findByEmail = async (email) => {
try {
    console.log('findByEmail called with:', email);
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    console.log('findByEmail found rows:', rows.length);
    if (rows.length) {
    return rows[0];
    }
    return null;
} catch (err) {
    console.error('Error in findByEmail:', err);
    throw err;
}
};

User.findById = async (id) => {
try {
    const [rows] = await db.execute('SELECT id, name, email, role, expertise FROM users WHERE id = ?', [id]);
    if (rows.length) {
    return rows[0];
    }
    return null;
} catch (err) {
    console.error('Error in findById:', err);
    throw err;
}
};

module.exports = User;
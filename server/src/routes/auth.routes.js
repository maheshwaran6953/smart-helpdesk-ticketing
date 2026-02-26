const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');const verifyToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/test-user', verifyToken, (req, res) => {
    res.json({ message: 'Anyone logged in can see this', user: req.user });
});

router.get('/test-admin', verifyToken, allowRoles('admin'), (req, res) => {
    res.json({ message: 'Only admin can see this', user: req.user });
});

module.exports = router;
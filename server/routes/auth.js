const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password)
      return res.status(400).json({ message: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(400).json({ message: 'Username already taken' });

    const user = await User.create({ name, username, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, username: user.username },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid username or password' });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, username: user.username },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

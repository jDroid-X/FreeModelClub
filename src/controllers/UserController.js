/**
 * UserController.js
 * Purpose: CRUD operations for user profile data stored in data/users.json.
 */
const db = require('../models/Database');

class UserController {
  static getUsers(req, res) {
    try {
      const users = db.read(db.files.users) || [];
      // Strip passwords from response
      const safe = users.map(u => ({ ...u, password: undefined }));
      res.json({ success: true, users: safe });
    } catch (e) {
      console.error('[UserController.getUsers]', e.message);
      res.status(500).json({ success: false, error: e.message });
    }
  }

  static getUserByEmail(req, res) {
    try {
      const { email } = req.query;
      const users = db.read(db.files.users) || [];
      const user = email 
        ? users.find(u => u.email?.toLowerCase() === email.toLowerCase())
        : (users[0] || null);

      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      const safe = { ...user, password: undefined };
      res.json({ success: true, user: safe });
    } catch (e) {
      console.error('[UserController.getUserByEmail]', e.message);
      res.status(500).json({ success: false, error: e.message });
    }
  }

  static updateUser(req, res) {
    try {
      const { email, name, phone, address, city, state, country, dob, avatar } = req.body || {};
      if (!email) return res.status(400).json({ success: false, error: 'email is required' });

      const users = db.read(db.files.users) || [];
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' });

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (city !== undefined) updates.city = city;
      if (state !== undefined) updates.state = state;
      if (country !== undefined) updates.country = country;
      if (dob !== undefined) updates.dob = dob;
      if (avatar !== undefined) updates.avatar = avatar;

      users[idx] = { ...users[idx], ...updates };
      db.write(db.files.users, users);
      const safe = { ...users[idx], password: undefined };
      res.json({ success: true, user: safe });
    } catch (e) {
      console.error('[UserController.updateUser]', e.message);
      res.status(500).json({ success: false, error: e.message });
    }
  }

  static createUser(req, res) {
    try {
      const { email, password, name, phone, address, city, state, country, dob, avatar } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'email and password are required' });
      }

      const users = db.read(db.files.users) || [];
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password,
        name: name || '',
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        country: country || '',
        dob: dob || '',
        avatar: avatar || '',
        emailVerified: true,
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      db.write(db.files.users, users);
      const safe = { ...newUser, password: undefined };
      res.json({ success: true, user: safe });
    } catch (e) {
      console.error('[UserController.createUser]', e.message);
      res.status(500).json({ success: false, error: e.message });
    }
  }
}

module.exports = UserController;

import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// TEMPORARY: パスワードリセット（緊急用）
router.post('/reset-admin', (req, res) => {
  try {
    const { secret } = req.body;
    
    // セキュリティ用の秘密キー
    if (secret !== 'emergency-reset-2026') {
      return res.status(403).json({ error: 'Invalid secret' });
    }
    
    // ID=1のユーザーのパスワードをリセット
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('UPDATE administrators SET username = ?, password = ? WHERE id = 1').run('麺家弍色', hashedPassword);
    
    const user = db.prepare('SELECT id, username, email FROM administrators WHERE id = 1').get();
    
    res.json({ 
      message: 'Password reset successful',
      user: user
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.prepare('SELECT * FROM administrators WHERE username = ? AND is_active = 1').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, permissions FROM administrators WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { username, email, phone, address, postal_code } = req.body;
    const userId = req.user.id;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Check if username is already taken by another user
    const existingUser = db.prepare('SELECT id FROM administrators WHERE username = ? AND id != ?').get(username, userId);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Update user profile
    db.prepare(`
      UPDATE administrators 
      SET username = ?, 
          email = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username, email, userId);

    // Return updated user data
    const updatedUser = db.prepare('SELECT id, username, email, role, permissions FROM administrators WHERE id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update email
router.put('/email', authenticateToken, (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verify password
    const user = db.prepare('SELECT password FROM administrators WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Update email
    db.prepare('UPDATE administrators SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(email, userId);

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Update password
router.put('/password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = db.prepare('SELECT password FROM administrators WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = bcrypt.compareSync(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE administrators SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, userId);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;

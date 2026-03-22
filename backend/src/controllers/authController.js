const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, uuid: user.uuid, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'user' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    if (!['user', 'collector'].includes(role))
      return res.status(400).json({ success: false, message: 'Rôle invalide' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const uuid = uuidv4();
    const [result] = await db.query(
      'INSERT INTO users (uuid, name, email, phone, password_hash, role) VALUES (?,?,?,?,?,?)',
      [uuid, name, email, phone || null, hash, role]
    );
    const userId = result.insertId;

    // Créer profil collecteur si besoin
    if (role === 'collector') {
      await db.query('INSERT INTO collector_profiles (user_id) VALUES (?)', [userId]);
    }

    // Notification de bienvenue
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)',
      [userId, 'Bienvenue sur EcoGarbage !', `Bonjour ${name}, votre compte a été créé avec succès.`, 'welcome']
    );

    const user = { id: userId, uuid, name, email, role };
    const token = generateToken(user);
    res.status(201).json({ success: true, message: 'Compte créé', data: { token, user } });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });

    const [rows] = await db.query(
      'SELECT id, uuid, name, email, phone, password_hash, role, is_active, is_verified, avatar_url FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const user = rows[0];
    if (!user.is_active)
      return res.status(403).json({ success: false, message: 'Compte suspendu. Contactez le support.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);
    res.json({ success: true, message: 'Connexion réussie', data: { token, user: safeUser } });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, uuid, name, email, phone, role, is_verified, is_active, avatar_url, address, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await db.query('UPDATE users SET name=?, phone=?, address=? WHERE id=?', [name, phone, address, req.user.id]);
    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id=?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };

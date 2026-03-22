const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// ========== NOTIFICATIONS ==========

const getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [[unread]] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND is_read=FALSE',
      [req.user.id]
    );
    res.json({ success: true, data: rows, unreadCount: unread.count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const markAllRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read=TRUE WHERE user_id=?', [req.user.id]);
    res.json({ success: true, message: 'Notifications marquées comme lues' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== RATINGS ==========

const createRating = async (req, res) => {
  try {
    const { request_uuid, score, comment } = req.body;
    if (!score || score < 1 || score > 5)
      return res.status(400).json({ success: false, message: 'Note entre 1 et 5 requise' });

    const [rows] = await db.query(
      'SELECT * FROM pickup_requests WHERE uuid=? AND user_id=? AND status="completed"',
      [request_uuid, req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Demande non trouvée ou non complétée' });

    const req_ = rows[0];
    await db.query(
      'INSERT INTO ratings (request_id, user_id, collector_id, score, comment) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE score=?, comment=?',
      [req_.id, req.user.id, req_.collector_id, score, comment, score, comment]
    );

    // Recalculer la moyenne du collecteur
    const [[avg]] = await db.query(
      'SELECT AVG(score) as avg FROM ratings WHERE collector_id=?',
      [req_.collector_id]
    );
    await db.query(
      'UPDATE collector_profiles SET rating_avg=? WHERE user_id=?',
      [parseFloat(avg.avg).toFixed(2), req_.collector_id]
    );

    res.json({ success: true, message: 'Note enregistrée' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== COMPLAINTS ==========

const createComplaint = async (req, res) => {
  try {
    const { request_uuid, type, description } = req.body;
    if (!description) return res.status(400).json({ success: false, message: 'Description requise' });

    let request_id = null;
    if (request_uuid) {
      const [rows] = await db.query('SELECT id FROM pickup_requests WHERE uuid=?', [request_uuid]);
      if (rows.length) request_id = rows[0].id;
    }

    const uuid = uuidv4();
    await db.query(
      'INSERT INTO complaints (uuid, user_id, request_id, type, description) VALUES (?,?,?,?,?)',
      [uuid, req.user.id, request_id, type || 'other', description]
    );
    res.status(201).json({ success: true, message: 'Réclamation enregistrée', data: { uuid } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM complaints WHERE user_id=? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== PAYMENTS ==========

const getPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, r.uuid AS request_uuid, wc.name AS category_name
      FROM payments p
      JOIN pickup_requests r ON p.request_id = r.id
      JOIN waste_categories wc ON r.category_id = wc.id
      WHERE p.user_id=?
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const payRequest = async (req, res) => {
  try {
    const { payment_uuid, method } = req.body;
    await db.query(
      'UPDATE payments SET status="completed", method=?, paid_at=NOW(), transaction_ref=? WHERE uuid=? AND user_id=?',
      [method, `TXN-${Date.now()}`, payment_uuid, req.user.id]
    );
    res.json({ success: true, message: 'Paiement enregistré' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== CATEGORIES (public) ==========

const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM waste_categories WHERE is_active=TRUE ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ========== COLLECTOR ==========

const getCollectorTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let where = 'WHERE r.collector_id=?';
    const params = [req.user.id];
    if (status) { where += ' AND r.status=?'; params.push(status); }
    const [rows] = await db.query(`
      SELECT r.*, u.name AS user_name, u.phone AS user_phone,
        wc.name AS category_name, wc.icon AS category_icon
      FROM pickup_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN waste_categories wc ON r.category_id = wc.id
      ${where} ORDER BY r.created_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateCollectorAvailability = async (req, res) => {
  try {
    const { is_available } = req.body;
    await db.query('UPDATE collector_profiles SET is_available=? WHERE user_id=?', [is_available, req.user.id]);
    res.json({ success: true, message: is_available ? 'Vous êtes maintenant disponible' : 'Vous êtes maintenant indisponible' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getCollectorStats = async (req, res) => {
  try {
    const [[profile]] = await db.query('SELECT * FROM collector_profiles WHERE user_id=?', [req.user.id]);
    const [[completed]] = await db.query(
      "SELECT COUNT(*) as count FROM pickup_requests WHERE collector_id=? AND status='completed'",
      [req.user.id]
    );
    const [[earnings]] = await db.query(`
      SELECT COALESCE(SUM(p.amount),0) as total
      FROM payments p
      JOIN pickup_requests r ON p.request_id = r.id
      WHERE r.collector_id=? AND p.status='completed'
    `, [req.user.id]);
    res.json({ success: true, data: { profile, completed: completed.count, earnings: parseFloat(earnings.total) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getNotifications, markAllRead,
  createRating, createComplaint, getMyComplaints,
  getPayments, payRequest, getCategories,
  getCollectorTasks, updateCollectorAvailability, getCollectorStats
};

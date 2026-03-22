const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [[users]] = await db.query("SELECT COUNT(*) as total FROM users WHERE role='user'");
    const [[collectors]] = await db.query("SELECT COUNT(*) as total FROM users WHERE role='collector'");
    const [[totalReq]] = await db.query("SELECT COUNT(*) as total FROM pickup_requests");
    const [[completedReq]] = await db.query("SELECT COUNT(*) as total FROM pickup_requests WHERE status='completed'");
    const [[pendingReq]] = await db.query("SELECT COUNT(*) as total FROM pickup_requests WHERE status='pending'");
    const [[revenue]] = await db.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='completed'");
    const [[complaints]] = await db.query("SELECT COUNT(*) as total FROM complaints WHERE status='open'");

    const [recentRequests] = await db.query(`
      SELECT r.uuid, r.status, r.service_type, r.estimated_price, r.created_at,
        u.name AS user_name, wc.name AS category_name
      FROM pickup_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN waste_categories wc ON r.category_id = wc.id
      ORDER BY r.created_at DESC LIMIT 8
    `);

    const [topCollectors] = await db.query(`
      SELECT u.name, cp.total_collections, cp.rating_avg
      FROM collector_profiles cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.total_collections DESC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: {
          users: users.total, collectors: collectors.total,
          totalRequests: totalReq.total, completedRequests: completedReq.total,
          pendingRequests: pendingReq.total,
          revenue: parseFloat(revenue.total), openComplaints: complaints.total
        },
        recentRequests,
        topCollectors
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 15, search } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (role) { where += ' AND role=?'; params.push(role); }
    if (search) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const [rows] = await db.query(
      `SELECT id, uuid, name, email, phone, role, is_active, is_verified, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[count]] = await db.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
    res.json({ success: true, data: rows, pagination: { total: count.total, page: parseInt(page) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/admin/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.query('UPDATE users SET is_active=? WHERE id=?', [is_active, req.params.id]);
    res.json({ success: true, message: is_active ? 'Compte activé' : 'Compte suspendu' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/admin/complaints
const getComplaints = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, u.name AS user_name, u.email AS user_email,
        r.uuid AS request_uuid
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN pickup_requests r ON c.request_id = r.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/admin/complaints/:uuid
const respondComplaint = async (req, res) => {
  try {
    const { status, admin_response } = req.body;
    await db.query('UPDATE complaints SET status=?, admin_response=? WHERE uuid=?', [status, admin_response, req.params.uuid]);
    res.json({ success: true, message: 'Réclamation mise à jour' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dateFilter = period === 'week' ? '7 DAY' : period === 'year' ? '365 DAY' : '30 DAY';

    const [byCategory] = await db.query(`
      SELECT wc.name, COUNT(r.id) as count, SUM(r.estimated_price) as revenue
      FROM pickup_requests r
      JOIN waste_categories wc ON r.category_id = wc.id
      WHERE r.created_at >= NOW() - INTERVAL ${dateFilter} AND r.status='completed'
      GROUP BY wc.id, wc.name
    `);

    const [byStatus] = await db.query(`
      SELECT status, COUNT(*) as count
      FROM pickup_requests
      WHERE created_at >= NOW() - INTERVAL ${dateFilter}
      GROUP BY status
    `);

    const [dailyRevenue] = await db.query(`
      SELECT DATE(paid_at) as date, SUM(amount) as amount
      FROM payments
      WHERE paid_at >= NOW() - INTERVAL ${dateFilter} AND status='completed'
      GROUP BY DATE(paid_at)
      ORDER BY date ASC
    `);

    res.json({ success: true, data: { byCategory, byStatus, dailyRevenue } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/admin/categories
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM waste_categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, base_price, is_hazardous, is_recyclable } = req.body;
    await db.query(
      'INSERT INTO waste_categories (name, description, icon, base_price, is_hazardous, is_recyclable) VALUES (?,?,?,?,?,?)',
      [name, description, icon, base_price, is_hazardous || false, is_recyclable || false]
    );
    res.status(201).json({ success: true, message: 'Catégorie créée' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/admin/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, base_price, is_hazardous, is_recyclable, is_active } = req.body;
    await db.query(
      'UPDATE waste_categories SET name=?, description=?, icon=?, base_price=?, is_hazardous=?, is_recyclable=?, is_active=? WHERE id=?',
      [name, description, icon, base_price, is_hazardous, is_recyclable, is_active, req.params.id]
    );
    res.json({ success: true, message: 'Catégorie mise à jour' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getDashboard, getUsers, toggleUserStatus,
  getComplaints, respondComplaint,
  getReports, getCategories, createCategory, updateCategory
};

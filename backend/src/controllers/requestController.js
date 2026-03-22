const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// GET /api/requests  (user: own | admin: all)
const getRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = '';
    const params = [];

    if (req.user.role === 'user') {
      where = 'WHERE r.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'collector') {
      where = 'WHERE r.collector_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      where += (where ? ' AND' : 'WHERE') + ' r.status = ?';
      params.push(status);
    }

    const sql = `
      SELECT r.*, 
        u.name AS user_name, u.phone AS user_phone,
        c.name AS collector_name,
        wc.name AS category_name, wc.icon AS category_icon,
        py.status AS payment_status, py.amount AS payment_amount
      FROM pickup_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users c ON r.collector_id = c.id
      LEFT JOIN waste_categories wc ON r.category_id = wc.id
      LEFT JOIN payments py ON r.id = py.request_id
      ${where}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.query(sql, params);

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM pickup_requests r ${where}`,
      params.slice(0, -2)
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/requests/:uuid
const getRequestById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, 
        u.name AS user_name, u.phone AS user_phone, u.email AS user_email,
        c.name AS collector_name, c.phone AS collector_phone,
        wc.name AS category_name, wc.icon AS category_icon, wc.base_price,
        py.status AS payment_status, py.amount AS payment_amount, py.method AS payment_method,
        rt.score AS rating_score, rt.comment AS rating_comment
      FROM pickup_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users c ON r.collector_id = c.id
      LEFT JOIN waste_categories wc ON r.category_id = wc.id
      LEFT JOIN payments py ON r.id = py.request_id
      LEFT JOIN ratings rt ON r.id = rt.request_id
      WHERE r.uuid = ?
    `, [req.params.uuid]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    const req_ = rows[0];
    if (req.user.role === 'user' && req_.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Accès interdit' });

    res.json({ success: true, data: req_ });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { category_id, address, quantity_estimate, notes, scheduled_at, service_type = 'immediate' } = req.body;
    if (!category_id || !address)
      return res.status(400).json({ success: false, message: 'Catégorie et adresse requis' });

    const [cat] = await db.query('SELECT base_price FROM waste_categories WHERE id=?', [category_id]);
    if (!cat.length) return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });

    const uuid = uuidv4();
    const estimated_price = cat[0].base_price;

    await db.query(`
      INSERT INTO pickup_requests (uuid, user_id, category_id, address, quantity_estimate, notes, scheduled_at, service_type, estimated_price)
      VALUES (?,?,?,?,?,?,?,?,?)
    `, [uuid, req.user.id, category_id, address, quantity_estimate, notes, scheduled_at || null, service_type, estimated_price]);

    // Notifier l'utilisateur
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)',
      [req.user.id, 'Demande reçue', `Votre demande de collecte a été enregistrée. Nous vous assignons un collecteur.`, 'request']
    );

    res.status(201).json({ success: true, message: 'Demande créée', data: { uuid } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/requests/:uuid/status  (collector/admin)
const updateStatus = async (req, res) => {
  try {
    const { status, proof_url } = req.body;
    const validStatuses = ['approved','assigned','on_way','in_progress','completed','cancelled','failed'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Statut invalide' });

    const [rows] = await db.query('SELECT * FROM pickup_requests WHERE uuid=?', [req.params.uuid]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    const pickupReq = rows[0];

    // Vérification des droits
    if (req.user.role === 'collector' && pickupReq.collector_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Accès interdit' });

    const updates = { status };
    if (status === 'completed') {
      updates.collected_at = new Date();
      updates.final_price = pickupReq.estimated_price;
      // Créer le paiement
      await db.query(
        'INSERT IGNORE INTO payments (uuid, request_id, user_id, amount, status) VALUES (?,?,?,?,?)',
        [uuidv4(), pickupReq.id, pickupReq.user_id, pickupReq.estimated_price, 'pending']
      );
      // Incrémenter le compteur du collecteur
      if (pickupReq.collector_id) {
        await db.query('UPDATE collector_profiles SET total_collections = total_collections + 1 WHERE user_id=?', [pickupReq.collector_id]);
      }
    }
    if (proof_url) updates.proof_url = proof_url;

    await db.query('UPDATE pickup_requests SET ? WHERE uuid=?', [updates, req.params.uuid]);

    // Notification à l'utilisateur
    const statusMessages = {
      assigned: 'Un collecteur a été assigné à votre demande.',
      on_way: 'Votre collecteur est en route !',
      completed: 'Collecte terminée avec succès ! Pensez à noter votre collecteur.',
      cancelled: 'Votre demande a été annulée.',
    };
    if (statusMessages[status]) {
      await db.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)',
        [pickupReq.user_id, `Collecte ${status}`, statusMessages[status], 'update']
      );
    }

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/requests/:uuid/assign  (admin)
const assignCollector = async (req, res) => {
  try {
    const { collector_id } = req.body;
    await db.query(
      'UPDATE pickup_requests SET collector_id=?, status="assigned" WHERE uuid=?',
      [collector_id, req.params.uuid]
    );
    res.json({ success: true, message: 'Collecteur assigné' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /api/requests/:uuid (user - annulation)
const cancelRequest = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pickup_requests WHERE uuid=? AND user_id=?', [req.params.uuid, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    if (['completed','cancelled','in_progress'].includes(rows[0].status))
      return res.status(400).json({ success: false, message: 'Impossible d\'annuler cette demande' });
    await db.query('UPDATE pickup_requests SET status="cancelled" WHERE uuid=?', [req.params.uuid]);
    res.json({ success: true, message: 'Demande annulée' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getRequests, getRequestById, createRequest, updateStatus, assignCollector, cancelRequest };

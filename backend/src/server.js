require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('./config/db');

const app = express();

// ─── CORS : ouvert à toutes origines (frontend statique Vercel, mobile, Postman)
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());

// ─── Security (après CORS pour ne pas interférer)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── Rate limiting
const limiter     = rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 30,  message: { error: 'Trop de tentatives, réessayez dans 15 minutes.' } });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// ─── Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/comments',      require('./routes/comments'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/settings',      require('./routes/settings'));

// ─── Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV, time: new Date().toISOString() }));

// ─── 404
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

// ─── Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Erreur serveur interne' : err.message });
});

// ════════════════════════════════════════
//  DÉMARRAGE
// ════════════════════════════════════════
async function createDefaultAdmin() {
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@wanted.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024!';
  const adminName     = process.env.ADMIN_NAME     || 'Administrateur';
  try {
    const { rows } = await query('SELECT id, role FROM users WHERE email = $1', [adminEmail.toLowerCase()]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await query(
        `INSERT INTO users (full_name, email, password_hash, role, coins, badge, is_verified)
         VALUES ($1, $2, $3, 'admin', 500, 'Légende', true)`,
        [adminName, adminEmail.toLowerCase(), hash]
      );
      console.log('✅ Compte admin créé');
      console.log('   Email    :', adminEmail);
      console.log('   Password :', adminPassword);
    } else if (rows[0].role !== 'admin') {
      await query(`UPDATE users SET role='admin' WHERE email=$1`, [adminEmail.toLowerCase()]);
      console.log('✅ Rôle admin mis à jour pour', adminEmail);
    } else {
      console.log('ℹ️  Admin déjà existant:', adminEmail);
    }
  } catch (err) {
    console.error('⚠️  Admin creation error:', err.message);
  }
}

async function ensureDefaultSettings() {
  const defaults = [
    ['site_name','WANTED'],['site_description','Ensemble, retrouvons-les'],
    ['coins_per_repost','10'],['coins_per_share','5'],['coins_per_post','20'],
    ['coins_per_witness','50'],['coins_per_found','200'],['coins_welcome','100'],
    ['coin_value_xaf','1'],['min_withdraw_coins','500'],
  ];
  for (const [k, v] of defaults) {
    await query(`INSERT INTO site_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING`, [k, v]).catch(() => {});
  }
}

async function start() {
  try {
    await query('SELECT 1');
    console.log('✅ PostgreSQL connecté');
    await require('./config/migrate').runMigrations();
    await createDefaultAdmin();
    await ensureDefaultSettings();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`\n🚀 WANTED API → port ${PORT} | env: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Erreur démarrage:', err.message);
    process.exit(1);
  }
}

start();

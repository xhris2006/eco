const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔧 Initialisation de la base de données...');

  const schema = `
    CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'eco_garbage_db'}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    USE \`${process.env.DB_NAME || 'eco_garbage_db'}\`;

    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(20),
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user','collector','admin') NOT NULL DEFAULT 'user',
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      avatar_url VARCHAR(255),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- WASTE CATEGORIES
    CREATE TABLE IF NOT EXISTS waste_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      base_price DECIMAL(10,2) NOT NULL DEFAULT 500.00,
      is_hazardous BOOLEAN DEFAULT FALSE,
      is_recyclable BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- SERVICE AREAS
    CREATE TABLE IF NOT EXISTS service_areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'Cameroun',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- COLLECTOR PROFILES
    CREATE TABLE IF NOT EXISTS collector_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      vehicle_type VARCHAR(100),
      vehicle_plate VARCHAR(50),
      service_area_id INT,
      is_available BOOLEAN DEFAULT FALSE,
      rating_avg DECIMAL(3,2) DEFAULT 0.00,
      total_collections INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_area_id) REFERENCES service_areas(id)
    );

    -- PICKUP REQUESTS
    CREATE TABLE IF NOT EXISTS pickup_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      collector_id INT,
      category_id INT NOT NULL,
      status ENUM('pending','approved','assigned','on_way','in_progress','completed','cancelled','failed') DEFAULT 'pending',
      address TEXT NOT NULL,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      quantity_estimate VARCHAR(100),
      notes TEXT,
      image_url VARCHAR(255),
      proof_url VARCHAR(255),
      scheduled_at DATETIME,
      collected_at DATETIME,
      estimated_price DECIMAL(10,2),
      final_price DECIMAL(10,2),
      service_type ENUM('immediate','scheduled','recurring','business','bulk','recyclable') DEFAULT 'immediate',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (collector_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES waste_categories(id)
    );

    -- PAYMENTS
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      request_id INT NOT NULL UNIQUE,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      method ENUM('mobile_money','card','bank_transfer','cash') DEFAULT 'mobile_money',
      status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
      transaction_ref VARCHAR(255),
      paid_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES pickup_requests(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- RATINGS
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL UNIQUE,
      user_id INT NOT NULL,
      collector_id INT NOT NULL,
      score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES pickup_requests(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (collector_id) REFERENCES users(id)
    );

    -- COMPLAINTS
    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      request_id INT,
      type ENUM('missed_pickup','incorrect_pricing','collector_misconduct','service_quality','other') DEFAULT 'other',
      description TEXT NOT NULL,
      status ENUM('open','in_review','resolved','closed') DEFAULT 'open',
      admin_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (request_id) REFERENCES pickup_requests(id)
    );

    -- NOTIFICATIONS
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Données initiales : catégories
    INSERT IGNORE INTO waste_categories (name, description, icon, base_price, is_hazardous, is_recyclable) VALUES
      ('Déchets ménagers', 'Ordures ménagères classiques', 'trash', 500.00, FALSE, FALSE),
      ('Déchets organiques', 'Restes alimentaires, déchets de jardin', 'leaf', 600.00, FALSE, TRUE),
      ('Plastiques', 'Bouteilles, emballages plastiques', 'bottle', 750.00, FALSE, TRUE),
      ('Papier & Carton', 'Journaux, cartons, papiers', 'newspaper', 500.00, FALSE, TRUE),
      ('Verre', 'Bouteilles et objets en verre', 'glass', 800.00, FALSE, TRUE),
      ('Métaux', 'Ferraille, canettes, aluminium', 'wrench', 1000.00, FALSE, TRUE),
      ('Déchets électroniques', 'Téléphones, PC, électroménager', 'laptop', 2000.00, FALSE, FALSE),
      ('Déchets dangereux', 'Piles, produits chimiques, médicaments', 'warning', 3000.00, TRUE, FALSE),
      ('Encombrants', 'Meubles, gros appareils', 'couch', 3500.00, FALSE, FALSE);

    -- Données initiales : zones de service
    INSERT IGNORE INTO service_areas (name, city, country) VALUES
      ('Yaoundé Centre', 'Yaoundé', 'Cameroun'),
      ('Bastos', 'Yaoundé', 'Cameroun'),
      ('Nlongkak', 'Yaoundé', 'Cameroun'),
      ('Biyem-Assi', 'Yaoundé', 'Cameroun'),
      ('Abidjan Plateau', 'Abidjan', 'Côte d''Ivoire'),
      ('Cocody', 'Abidjan', 'Côte d''Ivoire');

    -- Admin par défaut (password: Admin1234!)
    INSERT IGNORE INTO users (uuid, name, email, phone, password_hash, role, is_verified, is_active) VALUES
      ('00000000-0000-0000-0000-000000000001', 'Administrateur', 'admin@eco-garbage.com', '+237600000000',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE, TRUE);
  `;

  try {
    await conn.query(schema);
    console.log('✅ Base de données initialisée avec succès !');
    console.log('👤 Admin par défaut : admin@eco-garbage.com / Admin1234!');
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation:', err.message);
  } finally {
    await conn.end();
  }
}

initDatabase();

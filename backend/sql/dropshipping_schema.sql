-- ========================================
-- Dropshipping Database Schema
-- ========================================

-- Store supplier configurations and credentials
CREATE TABLE IF NOT EXISTS supplier_api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT 1,
  api_key VARCHAR(500),
  api_secret VARCHAR(500),
  access_token VARCHAR(500),
  client_id VARCHAR(255),
  merchant_id VARCHAR(255),
  seller_id VARCHAR(255),
  webhook_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_verified_at TIMESTAMP NULL
);

-- Store orders with supplier tracking
CREATE TABLE IF NOT EXISTS dropshipping_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reference_order_id VARCHAR(100) NOT NULL UNIQUE,
  customer_id INT,
  supplier_name VARCHAR(50) NOT NULL,
  supplier_order_id VARCHAR(100),
  status ENUM('pending', 'submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed') DEFAULT 'pending',
  
  -- Customer details
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Shipping details
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_pincode VARCHAR(20),
  shipping_country VARCHAR(100) DEFAULT 'IN',
  
  -- Pricing
  supplier_total DECIMAL(10, 2),
  margin_applied DECIMAL(10, 2),
  retail_total DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  
  -- Tracking
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),
  estimated_delivery DATE,
  
  -- Metadata
  items_count INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL
);

-- Store order items with margin details
CREATE TABLE IF NOT EXISTS dropshipping_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id VARCHAR(100),
  supplier VARCHAR(50),
  quantity INT,
  variant_id VARCHAR(100),
  supplier_price DECIMAL(10, 2),
  margin_percentage DECIMAL(5, 2),
  margin_amount DECIMAL(10, 2),
  retail_price DECIMAL(10, 2),
  subtotal DECIMAL(10, 2),
  customization JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES dropshipping_orders(id) ON DELETE CASCADE
);

-- Store margin configurations per product/supplier
CREATE TABLE IF NOT EXISTS margin_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier VARCHAR(50),
  product_id VARCHAR(100),
  margin_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  margin_value DECIMAL(10, 2),
  min_quantity INT DEFAULT 1,
  max_quantity INT,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product cache from suppliers
CREATE TABLE IF NOT EXISTS supplier_products_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier VARCHAR(50),
  product_id VARCHAR(100),
  product_name VARCHAR(500),
  category VARCHAR(100),
  supplier_price DECIMAL(10, 2),
  description TEXT,
  image_url VARCHAR(1000),
  images JSON,
  rating DECIMAL(3, 2),
  reviews_count INT,
  colors JSON,
  metadata JSON,
  
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  UNIQUE KEY unique_supplier_product (supplier, product_id),
  INDEX idx_supplier (supplier),
  INDEX idx_category (category)
);

-- Sync logs for monitoring
CREATE TABLE IF NOT EXISTS sync_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier VARCHAR(50),
  sync_type ENUM('products', 'orders', 'status') DEFAULT 'products',
  status ENUM('started', 'success', 'failed', 'partial') DEFAULT 'started',
  products_synced INT DEFAULT 0,
  products_updated INT DEFAULT 0,
  error_message TEXT,
  sync_duration_seconds INT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

-- API usage tracking (for rate limiting and analytics)
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INT,
  response_time_ms INT,
  request_ip VARCHAR(45),
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_endpoint (endpoint),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

-- ========================================
-- Indexes for better performance
-- ========================================

ALTER TABLE dropshipping_orders ADD INDEX idx_status (status);
ALTER TABLE dropshipping_orders ADD INDEX idx_supplier (supplier_name);
ALTER TABLE dropshipping_orders ADD INDEX idx_customer (customer_id);
ALTER TABLE dropshipping_orders ADD INDEX idx_created (created_at);
ALTER TABLE dropshipping_order_items ADD INDEX idx_supplier (supplier);
ALTER TABLE supplier_products_cache ADD INDEX idx_expires (expires_at);

-- ========================================
-- Sample Data for Testing
-- ========================================

INSERT INTO supplier_api_keys (provider, is_active) VALUES
('glowroad', 1),
('roposo', 1),
('cj_dropshipping', 1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

INSERT INTO margin_configs (supplier, margin_type, margin_value) VALUES
('glowroad', 'percentage', 30),
('roposo', 'percentage', 30),
('cj_dropshipping', 'percentage', 30)
ON DUPLICATE KEY UPDATE margin_value = VALUES(margin_value);

1) Import schema.sql in MySQL/phpMyAdmin  2) Put logo-white.png and logo-black.png in public/img
3) npm install  4) set env: DB_USER DB_PASS DB_NAME WHATSAPP(923xxxxxxxxx) SESSION_SECRET  5) npm start -> http://localhost:3000
Add schools/products via phpMyAdmin (tables: schools, products). Image column = path like /img/p1.jpg

ROUND 2: npm install (adds multer). Existing DB: run  ALTER TABLE orders ADD COLUMN delivery INT DEFAULT 0;
Extra env vars: ADMIN_PASS (required for /admin), DELIVERY_FEE (default 250), FREE_OVER (default 5000), BANK_DETAILS, ADDRESS, PHONE
Gallery photos: copy jpg/png/webp files into public/gallery. Admin panel: /admin
Existing DB: CREATE TABLE reviews(id INT AUTO_INCREMENT PRIMARY KEY,product_id INT,name VARCHAR(60),rating TINYINT,comment VARCHAR(500),approved TINYINT DEFAULT 0,created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

ROUND 3 (Bootstrap UI + customer accounts). Existing DB: ALTER TABLE orders ADD COLUMN user_id INT NULL; and create table customers (see schema.sql). Bootstrap loads from CDN.

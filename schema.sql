CREATE DATABASE IF NOT EXISTS fs_creations; USE fs_creations;
CREATE TABLE schools(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120),slug VARCHAR(120) UNIQUE,city VARCHAR(60));
CREATE TABLE categories(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(80),slug VARCHAR(80) UNIQUE);
CREATE TABLE products(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(160),price INT,school_id INT NULL,category_id INT,gender ENUM('boys','girls','gents','ladies','all') DEFAULT 'all',sizes VARCHAR(200) DEFAULT '',image VARCHAR(200) DEFAULT '',description TEXT);
CREATE TABLE orders(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),phone VARCHAR(30),city VARCHAR(60),address TEXT,payment VARCHAR(30),total INT,delivery INT DEFAULT 0,user_id INT NULL,status VARCHAR(20) DEFAULT 'new',created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE order_items(id INT AUTO_INCREMENT PRIMARY KEY,order_id INT,product_id INT,name VARCHAR(160),size VARCHAR(30),qty INT,price INT);
INSERT INTO categories(name,slug) VALUES('School Uniforms','school-uniforms'),('Gents Suits','gents-suits'),('Ladies Suits','ladies-suits'),('Bags','bags'),('Water Bottles','water-bottles');
INSERT INTO schools(name,slug,city) VALUES('Sample Grammar School','sample-grammar','Karachi'),('Sample Public School','sample-public','Karachi');
INSERT INTO products(name,price,school_id,category_id,gender,sizes) VALUES
('Shirt (White)',1200,1,1,'boys','24,26,28,30,32'),('Pant (Grey)',1800,1,1,'boys','24,26,28,30,32'),
('Qameez (Sky Blue)',1500,2,1,'girls','S,M,L,XL'),('Shalwar (Navy)',1100,2,1,'girls','S,M,L,XL'),
('Wash & Wear Suit',3200,NULL,2,'gents','Unstitched'),('Lawn Suit 3pc',4500,NULL,3,'ladies','Unstitched'),
('School Bag',2500,NULL,4,'all',''),('Steel Water Bottle',900,NULL,5,'all','');
CREATE TABLE reviews(id INT AUTO_INCREMENT PRIMARY KEY,product_id INT,name VARCHAR(60),rating TINYINT,comment VARCHAR(500),approved TINYINT DEFAULT 0,created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE customers(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),email VARCHAR(120) UNIQUE,phone VARCHAR(30),password VARCHAR(200),created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

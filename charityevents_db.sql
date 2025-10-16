-- 完整的数据库结构（包含天气API所需的经纬度字段）

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS charityevents_db;

-- 选择数据库
USE charityevents_db;

-- 删除旧表
DROP TABLE IF EXISTS `registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `categories`;

-- 创建分类表
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入分类数据
INSERT INTO `categories` VALUES 
(1,'Fun Run'),
(2,'Gala Dinner'),
(3,'Charity Auction');

-- 创建活动表（添加经纬度字段用于天气API）
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `date` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `ticket_price` decimal(10,2) DEFAULT NULL,
  `goal_amount` decimal(10,2) DEFAULT '0.00',
  `current_amount` decimal(10,2) DEFAULT '0.00',
  `category_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入活动数据（包含经纬度）
INSERT INTO `events` VALUES 
(1,'Autumn Charity Fun Run 2025','A 5K run to raise funds for children\'s hospital','2025-10-20 09:00:00','Sydney Olympic Park',-33.8476,151.0639,30.00,10000.00,9500.00,1,1),
(2,'Winter Glow Run 2025','Glow-in-the-dark night run for a cause','2025-11-15 19:30:00','Bondi Beach',-33.8915,151.2767,35.00,12000.00,2000.00,1,1),
(3,'Summer Health Run 2025','Community wellness run','2025-12-10 08:00:00','Centennial Park',-33.8976,151.2343,25.00,8000.00,8200.00,1,1),
(4,'Winter Charity Gala 2025','Elegant evening with dinner and auctions','2025-12-12 18:30:00','Sydney Opera House',-33.8568,151.2153,200.00,50000.00,5000.00,2,1),
(5,'New Year Charity Gala 2026','Annual gala celebrating with giving','2026-01-15 20:00:00','Darling Harbour',-33.8737,151.2006,180.00,40000.00,41000.00,2,1),
(6,'Art for Hope Auction 2025','Fine art charity auction','2025-10-25 14:00:00','Art Gallery of NSW',-33.8688,151.2174,0.00,30000.00,0.00,3,1),
(7,'Vintage Treasures Auction 2025','Antiques charity auction','2025-11-20 15:00:00','Powerhouse Museum',-33.8786,151.1991,50.00,25000.00,26000.00,3,1),
(8,'Digital Art NFT Charity Auction 2025','Online NFT auction','2025-11-30 20:00:00','Online Platform',-33.8688,151.2093,0.00,20000.00,3000.00,3,1);

-- 创建注册表
CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `tickets_count` int DEFAULT '1',
  `registration_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_registration` (`event_id`,`email`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_registration_date` (`registration_date`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入注册数据（至少10条，按日期倒序）
INSERT INTO `registrations` VALUES 
(1,1,'John Smith','john@email.com','0412345678',2,'2025-10-15 10:00:00',60.00),
(2,1,'Sarah Johnson','sarah@email.com','0423456789',1,'2025-10-14 14:30:00',30.00),
(3,1,'Michael Brown','michael@email.com','0434567890',3,'2025-10-13 09:15:00',90.00),
(4,2,'Emma Wilson','emma@email.com','0445678901',2,'2025-10-12 16:20:00',70.00),
(5,2,'Oliver Davis','oliver@email.com','0456789012',1,'2025-10-11 11:45:00',35.00),
(6,4,'Sophia Miller','sophia@email.com','0467890123',2,'2025-10-10 18:00:00',400.00),
(7,5,'Liam Garcia','liam@email.com','0478901234',1,'2025-10-09 20:30:00',180.00),
(8,6,'Ava Martinez','ava@email.com','0489012345',1,'2025-10-08 13:00:00',0.00),
(9,7,'Noah Rodriguez','noah@email.com','0490123456',2,'2025-10-07 15:30:00',100.00),
(10,8,'Isabella Lopez','isabella@email.com','0401234567',1,'2025-10-06 19:00:00',0.00),
(11,1,'James Wilson','james@email.com','0412345679',1,'2025-10-05 12:00:00',30.00),
(12,2,'Emily Brown','emily@email.com','0423456780',2,'2025-10-04 16:30:00',70.00);
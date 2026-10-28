-- Rudraksh database backup
-- Database: rudraksh_db
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int unsigned DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_admin` (`admin_id`),
  KEY `idx_activity_action` (`action`),
  KEY `idx_activity_date` (`created_at`),
  CONSTRAINT `fk_activity_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `activity_logs` (`id`, `admin_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-18 21:02:54'),
(2, 1, 'ADMIN_CREATED', 'admin', '2', 'Administrator account \"admin@rudraksh\" was created.', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-18 21:13:29'),
(3, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 05:21:04'),
(4, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 05:56:51'),
(5, 1, 'ADMIN_CREATED', 'admin', '3', 'Administrator account \"admin2\" was created.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:18:09'),
(6, 3, 'ADMIN_LOGIN', 'admin', '3', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:18:30'),
(7, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:44:33'),
(8, 3, 'ADMIN_LOGIN', 'admin', '3', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:48:06'),
(9, 3, 'SECURITY_VIOLATION', 'admin_account', '3', 'Unauthorized security violation. 2 attempt(s) remaining. Reason: Unauthorized attempt to access Website Content.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:48:28'),
(10, 3, 'SECURITY_VIOLATION', 'admin_account', '3', 'Unauthorized security violation. 1 attempt(s) remaining. Reason: Unauthorized attempt to access Website Content.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:48:28'),
(11, 3, 'ADMIN_LOGIN', 'admin', '3', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:48:34'),
(12, 3, 'SECURITY_ACCOUNT_LOCKED', 'admin_account', '3', 'Security account automatically locked. Reason: Unauthorized attempt to access Website Content.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:48:35'),
(13, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:49:00'),
(14, 1, 'ADMIN_SECURITY_UNLOCKED', 'admin_account', '3', 'Super Administrator unlocked admin account #3 and reset security attempts to 3.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 19:57:29'),
(15, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 20:16:47'),
(16, 1, 'ADMIN_LOGIN', 'admin', '1', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 20:20:00'),
(17, 3, 'ADMIN_LOGIN', 'admin', '3', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 21:45:29'),
(18, 3, 'SECURITY_VIOLATION', 'admin_account', '3', 'Unauthorized security violation. 2 attempt(s) remaining. Reason: Unauthorized attempt to access Website Content.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 21:45:33'),
(19, 3, 'SECURITY_VIOLATION', 'admin_account', '3', 'Unauthorized security violation. 1 attempt(s) remaining. Reason: Unauthorized attempt to access Website Content.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 21:45:33'),
(20, 3, 'ADMIN_LOGIN', 'admin', '3', 'Administrator logged into the admin panel.', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0', '2026-09-19 21:45:38');

DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin','editor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `security_attempts_remaining` tinyint unsigned NOT NULL DEFAULT '3',
  `locked_at` datetime DEFAULT NULL,
  `locked_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lock_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`id`, `name`, `username`, `email`, `password_hash`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`, `security_attempts_remaining`, `locked_at`, `locked_ip`, `lock_reason`) VALUES
(1, 'Rudraksh Administrator', 'admin', 'prantikck@gmail.com', '$2b$12$OE213Q4iHPZGQKxGE3XkWO4WKneuc5PtBdvHv94.ilYWmyYOH59DC', 'super_admin', 1, '2026-09-19 20:20:00', '2026-09-18 16:09:31', '2026-09-19 20:20:00', 3, NULL, NULL, NULL),
(2, 'RUDRAKSH', 'admin@rudraksh', 'rudrakshsocialculturalorganiza@gmail.com', '$2b$12$Znebdpik9dmjHJl.QwyyEO7MXcsEVVILdIQFULEj882DADYdP4v8G', 'admin', 1, NULL, '2026-09-18 21:13:29', '2026-09-18 21:13:29', 3, NULL, NULL, NULL),
(3, 'RUDRAKSH-1', 'admin2', 'rudrakshsocialcultural@gmail.com', '$2b$12$in5Wzwmd85YPWAiiyVYHceMZpiUwG3P3zbWQN1BagELMXWpdgX88a', 'admin', 1, '2026-09-19 21:45:38', '2026-09-19 19:18:09', '2026-09-19 21:45:38', 1, NULL, NULL, NULL);

DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('unread','read','replied','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unread',
  `replied_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_status` (`status`),
  KEY `idx_contact_date` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `replied_at`, `created_at`, `updated_at`) VALUES
(1, 'wdecw', 'qwsbgdy@gmail.com', '888888888', 'deepshikha j shundor', 'deepshikha j shundor', 'read', NULL, '2026-09-19 20:21:36', '2026-09-19 20:21:42');

DROP TABLE IF EXISTS `donations`;
CREATE TABLE `donations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `donor_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `donor_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `donor_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `razorpay_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpay_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpay_signature` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('created','pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'created',
  `payment_method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `razorpay_order_id` (`razorpay_order_id`),
  UNIQUE KEY `razorpay_payment_id` (`razorpay_payment_id`),
  KEY `idx_donations_status` (`payment_status`),
  KEY `idx_donations_date` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `donations` (`id`, `donor_name`, `donor_email`, `donor_phone`, `amount`, `currency`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `payment_status`, `payment_method`, `message`, `is_anonymous`, `paid_at`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, NULL, '1.00', 'INR', 'order_Tdmx3o5EbW25SM', 'pay_Tdmx8LX9ee4D60', '2449e695374ecfdfe414dbaa6ac2b1a21450994bfe48ee2f0d474718471e25a8', 'paid', NULL, NULL, 1, '2026-09-19 05:59:59', '2026-09-19 05:59:23', '2026-09-19 05:59:59'),
(2, NULL, NULL, NULL, '5000.00', 'INR', 'order_Te1RXoxOXooyrO', NULL, NULL, 'created', NULL, NULL, 1, NULL, '2026-09-19 20:09:59', '2026-09-19 20:09:59');

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_events_date` (`event_date`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_published` (`is_published`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `events` (`id`, `title`, `slug`, `description`, `event_date`, `event_time`, `location`, `cover_image`, `status`, `is_published`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'dwedewd', 'deepshikha', 'i love you', '2006-01-30 18:30:00', NULL, NULL, '/uploads/events/2308580-16x9-1789838172072-686491560.jpg', 'upcoming', 1, 0, '2026-09-19 17:12:39', '2026-09-19 17:19:52');

DROP TABLE IF EXISTS `faqs`;
CREATE TABLE `faqs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `question` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_faq_order` (`display_order`),
  KEY `idx_faq_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gallery`;
CREATE TABLE `gallery` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_id` int unsigned DEFAULT NULL,
  `project_id` int unsigned DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_gallery_event` (`event_id`),
  KEY `fk_gallery_project` (`project_id`),
  KEY `idx_gallery_category` (`category`),
  KEY `idx_gallery_published` (`is_published`),
  KEY `idx_gallery_order` (`display_order`),
  CONSTRAINT `fk_gallery_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_gallery_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gallery` (`id`, `title`, `description`, `image_url`, `category`, `event_id`, `project_id`, `display_order`, `is_published`, `created_at`, `updated_at`) VALUES
(1, 'bash', 'dwfcwdecvfw', '/uploads/gallery/gallery-1789797508225-872083462.jpg', 'wdcvwdf', NULL, NULL, 0, 1, '2026-09-19 05:58:28', '2026-09-19 05:58:28'),
(6, 'wdwed', 'ddwd21q', '/uploads/gallery/gallery-1789849133772-793973114.jpg', 'dewd', 1, 1, 2, 1, '2026-09-19 20:18:53', '2026-09-19 20:18:53');

DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joined_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_members_active` (`is_active`),
  KEY `idx_members_order` (`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `members` (`id`, `name`, `position`, `bio`, `photo_url`, `phone`, `email`, `joined_date`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'fakirobazar', 'co-bash bagan er malik', NULL, 'https://tse2.mm.bing.net/th/id/OIP.uinbsW_Kbu0SKMyAV9jVZwHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', NULL, 'bashbagan@gmail.com', '2000-02-01 18:30:00', 1, 0, '2026-09-19 05:56:59', '2026-09-19 05:56:59'),
(2, 'fakirobazar2.0', 'DFGHJK', NULL, '/uploads/members/1789840680048-769157150-wallpaperflare-com_wallpaper-1x1.jpg', '52363987415', 'jkbdwkncnb@gmail.com', '2019-06-02 18:30:00', 1, 0, '2026-09-19 17:58:00', '2026-09-19 17:58:00');

DROP TABLE IF EXISTS `membership_applications`;
CREATE TABLE `membership_applications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `date_of_birth` date DEFAULT NULL,
  `occupation` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` int unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_membership_reviewer` (`reviewed_by`),
  KEY `idx_membership_status` (`status`),
  KEY `idx_membership_date` (`created_at`),
  CONSTRAINT `fk_membership_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` text COLLATE utf8mb4_unicode_ci,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_date` date DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_published` (`is_published`),
  KEY `idx_projects_order` (`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` (`id`, `title`, `slug`, `short_description`, `description`, `cover_image`, `project_date`, `location`, `status`, `is_featured`, `is_published`, `display_order`, `created_at`, `updated_at`) VALUES
(1, 'faskirobazar', 'bash-bagan-er-mailk-aami-bash-aami-khai', NULL, NULL, 'https://tse2.mm.bing.net/th/id/OIP.uinbsW_Kbu0SKMyAV9jVZwHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', '2000-02-01 18:30:00', NULL, 'completed', 0, 1, 0, '2026-09-19 05:57:39', '2026-09-19 05:57:39'),
(4, 'WCWDW', 'bash-bagan-er-mailk-aami-bash-aami-kha', NULL, NULL, 'https://tse2.mm.bing.net/th/id/OIP.uinbsW_Kbu0SKMyAV9jVZwHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', '2000-02-01 18:30:00', NULL, 'completed', 0, 1, 1, '2026-09-19 06:14:29', '2026-09-19 06:14:29'),
(5, 'xxde', 'ecxecxecxe', 'eccxecxee', 'ecxdcxexcecx', 'ecxecxecxecxe', '2003-01-31 18:30:00', NULL, 'completed', 0, 1, 3, '2026-09-19 15:29:30', '2026-09-19 15:29:30'),
(6, 'er3f3r4f', 'r3fr3f3', 'rf3vfcrvf3r', 'rf3evffvc', 'r3efvfcr3', '2000-02-01 18:30:00', NULL, 'completed', 0, 1, 4, '2026-09-19 15:29:53', '2026-09-19 15:29:53'),
(7, 'sxqcxsdwcdc', 'cdwcdwc', 'cdwcwcw', 'wdcdcwdcw', '/uploads/projects/1789841165857-146501944-360_f_1542323292_vpxi2bypefhgszuvusrljlacfn0yzp6d-16x9.jpg', '2003-02-01 18:30:00', NULL, 'completed', 0, 1, 5, '2026-09-19 18:06:05', '2026-09-19 18:06:05'),
(8, 'wdecfcewfc', 'wedwcvwvcwc', 'cvvcvcewcv', 'devfwfdewvcecfdevc', '/uploads/projects/wallpaperflare-com_wallpaper-16x9-1789841248069-723642857.jpg', '2005-01-31 18:30:00', NULL, 'completed', 0, 1, 5, '2026-09-19 18:07:28', '2026-09-19 18:07:28'),
(9, 'ewdd', 'dewdcecd', 'eceec', 'ececce', '/uploads/projects/2308580-16x9-1789849050939-579340903.jpg', '2006-04-19 18:30:00', NULL, 'completed', 0, 1, 6, '2026-09-19 20:17:30', '2026-09-19 20:17:30');

DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('text','number','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 'organization_name', 'Rudraksh Social & Cultural Organization', 'text', 'Official organization name', '2026-09-18 15:51:04'),
(2, 'location', 'Nilambazar, Sribhumi district, Assam, India', 'text', 'Organization location', '2026-09-18 15:51:04'),
(3, 'email', 'rudrakshsocialandculturalorg@gmail.com', 'text', 'Official email address', '2026-09-18 15:51:04'),
(4, 'phone', '+919365716093', 'text', 'Official phone number', '2026-09-18 15:51:04'),
(5, 'whatsapp', 'https://wa.link/tvck85', 'text', 'Official WhatsApp link', '2026-09-18 15:51:04'),
(6, 'google_maps', 'https://maps.app.goo.gl/FPXGBVp8tz6Fy8rf9', 'text', 'Google Maps location', '2026-09-18 15:51:04');

DROP TABLE IF EXISTS `social_links`;
CREATE TABLE `social_links` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `platform` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform` (`platform`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `social_links` (`id`, `platform`, `url`, `icon`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'instagram', 'https://www.instagram.com/rudrakshsocialandculturalorg_/', 'instagram', 1, 1, '2026-09-18 15:51:04', '2026-09-18 15:51:04'),
(2, 'facebook', 'https://www.facebook.com/people/Rudraksh-Social-Cultural-Organization/61559876373123/', 'facebook', 2, 1, '2026-09-18 15:51:04', '2026-09-18 15:51:04'),
(3, 'linkedin', 'https://in.linkedin.com/in/rudraksh-social-and-cultural-organization-6b1b09405', 'linkedin', 3, 1, '2026-09-18 15:51:04', '2026-09-18 15:51:04'),
(4, 'youtube', 'https://youtube.com/@rudrakshsocialculturalorganiza', 'youtube', 4, 1, '2026-09-18 15:51:04', '2026-09-18 15:51:04');

SET FOREIGN_KEY_CHECKS=1;
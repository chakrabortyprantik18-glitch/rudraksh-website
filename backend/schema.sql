-- ============================================================
-- RUDRAKSH SOCIAL & CULTURAL ORGANIZATION
-- DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS rudraksh_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rudraksh_db;


-- ============================================================
-- 1. ADMIN USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    username VARCHAR(100) NOT NULL UNIQUE,

    email VARCHAR(255) UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('super_admin', 'admin', 'editor') NOT NULL DEFAULT 'admin',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    position VARCHAR(150),

    bio TEXT,

    photo_url VARCHAR(500),

    phone VARCHAR(30),

    email VARCHAR(255),

    joined_date DATE NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    display_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_members_active (is_active),

    INDEX idx_members_order (display_order)
);


-- ============================================================
-- 3. PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    slug VARCHAR(220) NOT NULL UNIQUE,

    short_description TEXT,

    description LONGTEXT,

    cover_image VARCHAR(500),

    project_date DATE NULL,

    location VARCHAR(255),

    status ENUM('upcoming', 'ongoing', 'completed')
        NOT NULL DEFAULT 'completed',

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    display_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_projects_status (status),

    INDEX idx_projects_published (is_published),

    INDEX idx_projects_order (display_order)
);


-- ============================================================
-- 4. EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    slug VARCHAR(220) NOT NULL UNIQUE,

    description LONGTEXT,

    event_date DATE NOT NULL,

    event_time TIME NULL,

    location VARCHAR(255),

    cover_image VARCHAR(500),

    status ENUM('upcoming', 'ongoing', 'completed')
        NOT NULL DEFAULT 'upcoming',

    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    display_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_events_date (event_date),

    INDEX idx_events_status (status),

    INDEX idx_events_published (is_published)
);


-- ============================================================
-- 5. GALLERY
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200),

    description TEXT,

    image_url VARCHAR(500) NOT NULL,

    category VARCHAR(100),

    event_id INT UNSIGNED NULL,

    project_id INT UNSIGNED NULL,

    display_order INT NOT NULL DEFAULT 0,

    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_gallery_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_gallery_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_gallery_category (category),

    INDEX idx_gallery_published (is_published),

    INDEX idx_gallery_order (display_order)
);


-- ============================================================
-- 6. DONATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS donations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    donor_name VARCHAR(150),

    donor_email VARCHAR(255),

    donor_phone VARCHAR(30),

    amount DECIMAL(12,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    razorpay_order_id VARCHAR(255) UNIQUE,

    razorpay_payment_id VARCHAR(255) UNIQUE,

    razorpay_signature VARCHAR(500),

    payment_status ENUM(
        'created',
        'pending',
        'paid',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'created',

    payment_method VARCHAR(100),

    message TEXT,

    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,

    paid_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_donations_status (payment_status),

    INDEX idx_donations_date (created_at)
);


-- ============================================================
-- 7. MEMBERSHIP APPLICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS membership_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(150) NOT NULL,

    email VARCHAR(255),

    phone VARCHAR(30) NOT NULL,

    address TEXT,

    date_of_birth DATE NULL,

    occupation VARCHAR(150),

    reason TEXT,

    photo_url VARCHAR(500),

    status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    reviewed_by INT UNSIGNED NULL,

    reviewed_at DATETIME NULL,

    admin_notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_membership_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_membership_status (status),

    INDEX idx_membership_date (created_at)
);


-- ============================================================
-- 8. CONTACT MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255),

    phone VARCHAR(30),

    subject VARCHAR(255),

    message TEXT NOT NULL,

    status ENUM(
        'unread',
        'read',
        'replied',
        'archived'
    ) NOT NULL DEFAULT 'unread',

    replied_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_contact_status (status),

    INDEX idx_contact_date (created_at)
);


-- ============================================================
-- 9. FAQs
-- ============================================================

CREATE TABLE IF NOT EXISTS faqs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    question VARCHAR(500) NOT NULL,

    answer TEXT NOT NULL,

    display_order INT NOT NULL DEFAULT 0,

    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_faq_order (display_order),

    INDEX idx_faq_published (is_published)
);


-- ============================================================
-- 10. SOCIAL LINKS
-- ============================================================

CREATE TABLE IF NOT EXISTS social_links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    platform VARCHAR(50) NOT NULL UNIQUE,

    url VARCHAR(500) NOT NULL,

    icon VARCHAR(100),

    display_order INT NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 11. WEBSITE SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,

    setting_value TEXT,

    setting_type ENUM(
        'text',
        'number',
        'boolean',
        'json'
    ) NOT NULL DEFAULT 'text',

    description VARCHAR(500),

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 12. ADMIN ACTIVITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id VARCHAR(100),

    description TEXT,

    ip_address VARCHAR(45),

    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_activity_admin (admin_id),

    INDEX idx_activity_action (action),

    INDEX idx_activity_date (created_at)
);


-- ============================================================
-- DEFAULT SOCIAL LINKS
-- ============================================================

INSERT IGNORE INTO social_links
(platform, url, icon, display_order)
VALUES
(
    'instagram',
    'https://www.instagram.com/rudrakshsocialandculturalorg_/',
    'instagram',
    1
),
(
    'facebook',
    'https://www.facebook.com/people/Rudraksh-Social-Cultural-Organization/61559876373123/',
    'facebook',
    2
),
(
    'linkedin',
    'https://in.linkedin.com/in/rudraksh-social-and-cultural-organization-6b1b09405',
    'linkedin',
    3
),
(
    'youtube',
    'https://youtube.com/@rudrakshsocialculturalorganiza',
    'youtube',
    4
);


-- ============================================================
-- DEFAULT WEBSITE SETTINGS
-- ============================================================

INSERT IGNORE INTO site_settings
(setting_key, setting_value, setting_type, description)
VALUES
(
    'organization_name',
    'Rudraksh Social & Cultural Organization',
    'text',
    'Official organization name'
),
(
    'location',
    'Nilambazar, Sribhumi district, Assam, India',
    'text',
    'Organization location'
),
(
    'email',
    'rudrakshsocialandculturalorg@gmail.com',
    'text',
    'Official email address'
),
(
    'phone',
    '+919365716093',
    'text',
    'Official phone number'
),
(
    'whatsapp',
    'https://wa.link/tvck85',
    'text',
    'Official WhatsApp link'
),
(
    'google_maps',
    'https://maps.app.goo.gl/FPXGBVp8tz6Fy8rf9',
    'text',
    'Google Maps location'
);


-- ============================================================
-- FINISHED
-- ============================================================

SELECT 'Rudraksh database schema created successfully.' AS message;
-- One-time cleanup before repopulating the public website.
-- This removes public content only.
-- Admin account, site settings, social links, database structure,
-- donations, membership applications and contact messages are NOT touched.

START TRANSACTION;

DELETE FROM gallery;
DELETE FROM projects;
DELETE FROM events;
DELETE FROM members;
DELETE FROM faqs;

COMMIT;

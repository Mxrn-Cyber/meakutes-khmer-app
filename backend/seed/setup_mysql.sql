-- Creates the database and application user for Meakutes-Khmer.
-- Run once, as a MySQL user that can create databases and users:
--
--     mysql -u root -p < backend/seed/setup_mysql.sql
--
-- The utf8mb4 charset is required: Khmer script and emoji will be corrupted
-- under latin1 or utf8 (which is only 3-byte in MySQL).

CREATE DATABASE IF NOT EXISTS meakutes_khmer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- MySQL treats 'localhost' (socket) and '127.0.0.1' (TCP) as different users,
-- and which one applies depends on how the client connects. Create both so it
-- works either way.
CREATE USER IF NOT EXISTS 'meakutes'@'localhost'  IDENTIFIED BY 'changeme';
CREATE USER IF NOT EXISTS 'meakutes'@'127.0.0.1'  IDENTIFIED BY 'changeme';

GRANT ALL PRIVILEGES ON meakutes_khmer.* TO 'meakutes'@'localhost';
GRANT ALL PRIVILEGES ON meakutes_khmer.* TO 'meakutes'@'127.0.0.1';

FLUSH PRIVILEGES;

-- Report what was actually created (reads the schema, not the session defaults).
SELECT SCHEMA_NAME        AS `database`,
       DEFAULT_CHARACTER_SET_NAME AS charset,
       DEFAULT_COLLATION_NAME     AS collation
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'meakutes_khmer';

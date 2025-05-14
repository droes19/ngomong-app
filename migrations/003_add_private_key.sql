-- Migration: Add private_key to user table (Version 3)
ALTER TABLE users ADD COLUMN private_key TEXT;
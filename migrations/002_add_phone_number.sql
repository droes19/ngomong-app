-- Migration: Add phone_number to user table (Version 2)
ALTER TABLE users ADD COLUMN phone_number TEXT;
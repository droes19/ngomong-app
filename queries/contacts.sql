-- :countAll
SELECT COUNT(*) as total FROM contacts;

-- :findByEmail
SELECT * FROM contacts WHERE email = ?;

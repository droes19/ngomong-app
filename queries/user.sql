-- :findByNickname
SELECT * FROM user WHERE nickname = ?;

-- :findByEmail
SELECT * FROM user WHERE email = ?;

-- :findByCredentials
SELECT * FROM user WHERE nickname = ? AND pin = ? LIMIT 1;

-- :countAll
SELECT COUNT(*) as total FROM user;

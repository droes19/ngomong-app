CREATE TABLE chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE group_chat (
  chat_id INTEGER PRIMARY KEY,
  group_name TEXT NOT NULL,
  admin_user_id INTEGER NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chat (id) ON DELETE CASCADE,
  FOREIGN KEY (admin_user_id) REFERENCES users (id)
);

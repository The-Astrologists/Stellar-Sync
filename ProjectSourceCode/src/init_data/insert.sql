INSERT INTO users(username, password, birthday) VALUES('bob', 'test123', '2012-08-05');
INSERT INTO users(username, password, birthday) VALUES('sue', 'test456', '1995-03-12');

INSERT INTO friendships(user_id, friend_id) VALUES(1, 2);
INSERT INTO friendships(user_id, friend_id) VALUES(2, 1);
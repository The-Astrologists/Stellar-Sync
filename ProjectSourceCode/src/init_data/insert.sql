INSERT INTO users(username, first_name, last_name, password, birthday, sign) VALUES('bob', 'bobby', 'joe', 'test123', '2012-08-05', 'Leo');
INSERT INTO users(username, first_name, last_name, password, birthday) VALUES('sue', 'susane', 'doe', 'test456', '1995-03-12', 'Pisces');

INSERT INTO friendships(user_id, friend_id) VALUES(1, 2);
INSERT INTO friendships(user_id, friend_id) VALUES(2, 1);
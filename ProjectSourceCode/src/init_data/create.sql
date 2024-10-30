CREATE TABLE users (
    user_id SERIAL PRIMARY KEY, 
    username VARCHAR(50), 
    password CHAR(60) NOT NULL, 
    birthday DATE NOT NULL
);

CREATE TABLE friendships (
    user_id INT, --REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INT, --REFERENCES users(user_id) ON DELETE CASCADE,
    --PRIMARY KEY (user_id, friend_id),
    CHECK (user_id <> friend_id) --can't friend yourself
);
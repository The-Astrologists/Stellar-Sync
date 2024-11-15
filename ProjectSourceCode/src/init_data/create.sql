CREATE TABLE users (
    user_id SERIAL PRIMARY KEY, 
    username VARCHAR(50) UNIQUE, 
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    password CHAR(60) NOT NULL, 
    birthday DATE NOT NULL, 
    sign VARCHAR(20)
);

CREATE TABLE friendships (
    user_id INT, --REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INT, --REFERENCES users(user_id) ON DELETE CASCADE,
    --PRIMARY KEY (user_id, friend_id),
    CHECK (user_id <> friend_id) --can't friend yourself
);
#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://user:pKwaoT0ifjSRXi7k9AGuPJKDYYwzwzDQ@dpg-csvphjbqf0us73fv7pug-a.oregon-postgres.render.com/users_db_6wdn"

# Execute each .sql file in the directory
for file in ProjectSourceCode/src/init_data/create.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
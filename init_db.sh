#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://user:9ZRXVw6sNrLXbi7cpPqZbVYhgKGYtyy8@dpg-csvol39opnds73ei4dng-a.oregon-postgres.render.com/users_db_i3d4"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://user:M8Ip9ss9cTjbD2BKpQCIXpEAqP5xFzcZ@dpg-csvo88hu0jms73eu4v30-a.oregon-postgres.render.com/users_db_xtck"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
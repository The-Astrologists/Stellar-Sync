#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://user:A0SRsnhsZT9rSKXD19WCWFmsRIjSqWQj@dpg-csvods52ng1s73du7ge0-a.oregon-postgres.render.com/users_db_q7yl"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://user:7NeRKiSpJaY6UvgQPouDr3mB0xpTTZIL@dpg-csvq6452ng1s73ea3oq0-a.oregon-postgres.render.com/user_db_4azi"

# Execute each .sql file in the directory
for file in ProjectSourceCode/src/init_data/create.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
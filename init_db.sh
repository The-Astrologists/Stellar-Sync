#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_soou_user:Iav17m7yaKvfLGdTxVSni1EwD2bwoaGT@dpg-csvmds0gph6c73e25730-a.oregon-postgres.render.com/users_db_soou"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
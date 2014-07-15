DROP ROLE IF EXISTS greenman;
CREATE USER greenman WITH PASSWORD 'grE3nun0';
DROP DATABASE IF EXISTS greenmanstore;
CREATE DATABASE greenmanstore TEMPLATE template_pgis;
GRANT ALL PRIVILEGES ON DATABASE "greenmanstore" to greenman;

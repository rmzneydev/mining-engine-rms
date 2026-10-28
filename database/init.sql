-- Separacion de responsabilidades: una instancia PostgreSQL, dos bases logicas.
-- Cada servicio tiene su propio usuario tecnico (credenciales solo de desarrollo).

CREATE USER auth_user WITH PASSWORD 'auth_dev_password';
CREATE USER business_user WITH PASSWORD 'business_dev_password';

CREATE DATABASE auth_db OWNER auth_user;
CREATE DATABASE business_db OWNER business_user;

-- Ningun servicio puede conectarse a la base del otro.
REVOKE ALL ON DATABASE auth_db FROM PUBLIC;
REVOKE ALL ON DATABASE business_db FROM PUBLIC;

GRANT CONNECT ON DATABASE auth_db TO auth_user;
GRANT CONNECT ON DATABASE business_db TO business_user;

-- Grabber: creación de bases y login de aplicación.
-- Ejecutar como administrador (Windows auth):
--   sqlcmd -S localhost -E -C -i scripts/setup-db.sql -v AppPassword="<contraseña>"
-- La contraseña entra como variable de sqlcmd, nunca escrita en este archivo.

IF DB_ID(N'grabber') IS NULL CREATE DATABASE grabber;
GO
IF DB_ID(N'grabber_test') IS NULL CREATE DATABASE grabber_test;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'grabber_app')
    CREATE LOGIN grabber_app WITH PASSWORD = N'$(AppPassword)', CHECK_POLICY = ON, DEFAULT_DATABASE = grabber;
GO

USE grabber;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'grabber_app')
    CREATE USER grabber_app FOR LOGIN grabber_app;
GO
ALTER ROLE db_datareader ADD MEMBER grabber_app;
ALTER ROLE db_datawriter ADD MEMBER grabber_app;
GRANT EXECUTE TO grabber_app;
GO

USE grabber_test;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'grabber_app')
    CREATE USER grabber_app FOR LOGIN grabber_app;
GO
ALTER ROLE db_datareader ADD MEMBER grabber_app;
ALTER ROLE db_datawriter ADD MEMBER grabber_app;
GRANT EXECUTE TO grabber_app;
GO

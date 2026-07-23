-- Índice de texto completo sobre LibraryItems.Title (buscador de biblioteca).
-- Ejecutar como admin DESPUÉS de la primera migración:
--   sqlcmd -S localhost -E -C -d grabber -i scripts/setup-fulltext.sql
-- Si el servicio de full-text no está instalado en la instancia, este script
-- no hace nada y la API cae a LIKE (lo avisa en el arranque).

IF FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') = 1
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'GrabberCatalog')
        CREATE FULLTEXT CATALOG GrabberCatalog AS DEFAULT;

    IF NOT EXISTS (
        SELECT 1 FROM sys.fulltext_indexes fi
        JOIN sys.objects o ON o.object_id = fi.object_id
        WHERE o.name = 'LibraryItems'
    )
    BEGIN
        DECLARE @pk sysname = (
            SELECT i.name FROM sys.indexes i
            JOIN sys.objects o ON o.object_id = i.object_id
            WHERE o.name = 'LibraryItems' AND i.is_primary_key = 1
        );
        DECLARE @sql nvarchar(max) = N'CREATE FULLTEXT INDEX ON dbo.LibraryItems (Title LANGUAGE 3082) KEY INDEX ' + QUOTENAME(@pk) + N' ON GrabberCatalog WITH CHANGE_TRACKING AUTO;';
        EXEC sp_executesql @sql;
        PRINT 'Índice de texto completo creado sobre LibraryItems.Title';
    END
    ELSE
        PRINT 'El índice de texto completo ya existe';
END
ELSE
    PRINT 'Full-text no está instalado en esta instancia: la API usará LIKE';

BEGIN TRY

BEGIN TRAN;

-- DropIndex: el UNIQUE plano de SQL Server trata los NULL como duplicados.
ALTER TABLE [dbo].[LibraryItems] DROP CONSTRAINT [LibraryItems_DownloadJobId_key];

-- Índice único filtrado: garantiza el 1:1 job↔item solo cuando hay job.
CREATE UNIQUE NONCLUSTERED INDEX [LibraryItems_DownloadJobId_key]
  ON [dbo].[LibraryItems]([DownloadJobId])
  WHERE [DownloadJobId] IS NOT NULL;

-- Default de Timezone en ASCII (el signo menos Unicode generaba drift).
ALTER TABLE [dbo].[UserPreferences] DROP CONSTRAINT [UserPreferences_Timezone_df];
ALTER TABLE [dbo].[UserPreferences] ADD CONSTRAINT [UserPreferences_Timezone_df] DEFAULT 'GMT-6 Ciudad de Mexico' FOR [Timezone];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

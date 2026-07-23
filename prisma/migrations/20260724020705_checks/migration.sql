BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[UserPreferences] DROP CONSTRAINT [UserPreferences_Timezone_df];
ALTER TABLE [dbo].[UserPreferences] ADD CONSTRAINT [UserPreferences_Timezone_df] DEFAULT 'GMT−6 · Ciudad de México' FOR [Timezone];

-- Restricciones que Prisma no declara en el schema:
-- NotificationSettings y Payload deben ser JSON válido.
ALTER TABLE [dbo].[UserPreferences] WITH CHECK
  ADD CONSTRAINT [CK_UserPreferences_NotificationSettings_IsJson]
  CHECK (ISJSON([NotificationSettings]) = 1);

ALTER TABLE [dbo].[Notifications] WITH CHECK
  ADD CONSTRAINT [CK_Notifications_Payload_IsJson]
  CHECK (ISJSON([Payload]) = 1);

-- Estados válidos de la cola (enum del spec; el API los mapea a los del frontend).
ALTER TABLE [dbo].[DownloadJobs] WITH CHECK
  ADD CONSTRAINT [CK_DownloadJobs_Status]
  CHECK ([Status] IN (N'queued', N'analyzing', N'downloading', N'paused', N'completed', N'failed', N'canceled'));

-- Tema válido en preferencias.
ALTER TABLE [dbo].[UserPreferences] WITH CHECK
  ADD CONSTRAINT [CK_UserPreferences_Theme]
  CHECK ([Theme] IN (N'light', N'dark', N'system'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

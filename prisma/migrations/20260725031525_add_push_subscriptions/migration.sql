BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PushSubscriptions] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PushSubscriptions_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Endpoint] NVARCHAR(500) NOT NULL,
    [P256dh] NVARCHAR(200) NOT NULL,
    [Auth] NVARCHAR(100) NOT NULL,
    [UserAgent] NVARCHAR(300),
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [PushSubscriptions_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PushSubscriptions_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [PushSubscriptions_Endpoint_key] UNIQUE NONCLUSTERED ([Endpoint])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PushSubscriptions_UserId_idx] ON [dbo].[PushSubscriptions]([UserId]);

-- AddForeignKey
ALTER TABLE [dbo].[PushSubscriptions] ADD CONSTRAINT [PushSubscriptions_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

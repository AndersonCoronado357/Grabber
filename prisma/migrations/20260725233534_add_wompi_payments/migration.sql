BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Users] ADD [AutoRenew] BIT NOT NULL CONSTRAINT [Users_AutoRenew_df] DEFAULT 0,
[PlanUntil] DATETIME2,
[RenewalReminderAt] DATETIME2,
[WompiPaymentSourceId] NVARCHAR(50);

-- CreateTable
CREATE TABLE [dbo].[Payments] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Payments_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Plan] NVARCHAR(20) NOT NULL,
    [AmountCents] INT NOT NULL,
    [Currency] NVARCHAR(3) NOT NULL CONSTRAINT [Payments_Currency_df] DEFAULT 'COP',
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [Payments_Status_df] DEFAULT 'PENDING',
    [Method] NVARCHAR(40),
    [Reference] NVARCHAR(120) NOT NULL,
    [WompiTransactionId] NVARCHAR(60),
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Payments_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Payments_UpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Payments_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [Payments_Reference_key] UNIQUE NONCLUSTERED ([Reference])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Payments_UserId_CreatedAt_idx] ON [dbo].[Payments]([UserId], [CreatedAt] DESC);

-- AddForeignKey
ALTER TABLE [dbo].[Payments] ADD CONSTRAINT [Payments_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Users] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Users_Id_df] DEFAULT newsequentialid(),
    [Email] NVARCHAR(320) NOT NULL,
    [Username] NVARCHAR(32) NOT NULL,
    [PasswordHash] NVARCHAR(255),
    [DisplayName] NVARCHAR(80),
    [Bio] NVARCHAR(280),
    [AvatarPath] NVARCHAR(400),
    [EmailVerifiedAt] DATETIME2,
    [Plan] NVARCHAR(20) NOT NULL CONSTRAINT [Users_Plan_df] DEFAULT 'free',
    [DeletedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Users_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Users_UpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Users_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [Users_Email_key] UNIQUE NONCLUSTERED ([Email]),
    CONSTRAINT [Users_Username_key] UNIQUE NONCLUSTERED ([Username])
);

-- CreateTable
CREATE TABLE [dbo].[UserPreferences] (
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Theme] NVARCHAR(10) NOT NULL CONSTRAINT [UserPreferences_Theme_df] DEFAULT 'system',
    [Locale] NVARCHAR(40) NOT NULL CONSTRAINT [UserPreferences_Locale_df] DEFAULT 'Español',
    [Timezone] NVARCHAR(60) NOT NULL CONSTRAINT [UserPreferences_Timezone_df] DEFAULT 'GMT−6 · Ciudad de México',
    [DefaultQuality] NVARCHAR(20) NOT NULL CONSTRAINT [UserPreferences_DefaultQuality_df] DEFAULT '1080p',
    [DefaultFormat] NVARCHAR(10) NOT NULL CONSTRAINT [UserPreferences_DefaultFormat_df] DEFAULT 'MP4',
    [FilenameTemplate] NVARCHAR(200) NOT NULL CONSTRAINT [UserPreferences_FilenameTemplate_df] DEFAULT '{titulo}-{calidad}',
    [ConcurrentDownloads] TINYINT NOT NULL CONSTRAINT [UserPreferences_ConcurrentDownloads_df] DEFAULT 2,
    [AutoPurgeTrash] BIT NOT NULL CONSTRAINT [UserPreferences_AutoPurgeTrash_df] DEFAULT 1,
    [NotificationSettings] NVARCHAR(max) NOT NULL CONSTRAINT [UserPreferences_NotificationSettings_df] DEFAULT '{}',
    CONSTRAINT [UserPreferences_pkey] PRIMARY KEY CLUSTERED ([UserId])
);

-- CreateTable
CREATE TABLE [dbo].[Sessions] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Sessions_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [RefreshTokenHash] NVARCHAR(255) NOT NULL,
    [PriorTokenHash] NVARCHAR(255),
    [UserAgent] NVARCHAR(400),
    [IpAddress] NVARCHAR(45),
    [DeviceLabel] NVARCHAR(120),
    [LastSeenAt] DATETIME2 NOT NULL CONSTRAINT [Sessions_LastSeenAt_df] DEFAULT CURRENT_TIMESTAMP,
    [ExpiresAt] DATETIME2 NOT NULL,
    [RevokedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Sessions_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Sessions_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[PasswordResetTokens] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [PasswordResetTokens_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [TokenHash] NVARCHAR(255) NOT NULL,
    [ExpiresAt] DATETIME2 NOT NULL,
    [ConsumedAt] DATETIME2,
    [Attempts] TINYINT NOT NULL CONSTRAINT [PasswordResetTokens_Attempts_df] DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [PasswordResetTokens_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordResetTokens_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[EmailVerificationCodes] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [EmailVerificationCodes_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [CodeHash] NVARCHAR(255) NOT NULL,
    [ExpiresAt] DATETIME2 NOT NULL,
    [ConsumedAt] DATETIME2,
    [Attempts] TINYINT NOT NULL CONSTRAINT [EmailVerificationCodes_Attempts_df] DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [EmailVerificationCodes_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [EmailVerificationCodes_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[TwoFactorSecrets] (
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [SecretEncrypted] VARBINARY(512) NOT NULL,
    [EnabledAt] DATETIME2,
    [RecoveryCodesHash] NVARCHAR(max),
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [TwoFactorSecrets_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TwoFactorSecrets_pkey] PRIMARY KEY CLUSTERED ([UserId])
);

-- CreateTable
CREATE TABLE [dbo].[MediaSources] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [MediaSources_Id_df] DEFAULT newsequentialid(),
    [Platform] NVARCHAR(20) NOT NULL,
    [SourceId] NVARCHAR(120) NOT NULL,
    [SourceUrl] NVARCHAR(1000) NOT NULL,
    [Title] NVARCHAR(500) NOT NULL,
    [Author] NVARCHAR(200),
    [DurationSeconds] INT,
    [ThumbnailUrl] NVARCHAR(1000),
    [PublishedAt] DATETIME2,
    [ViewCount] BIGINT,
    [AvailableFormats] NVARCHAR(max) NOT NULL CONSTRAINT [MediaSources_AvailableFormats_df] DEFAULT '[]',
    [RawMetadata] NVARCHAR(max),
    [FetchedAt] DATETIME2 NOT NULL CONSTRAINT [MediaSources_FetchedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [MediaSources_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MediaSources_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [MediaSources_Platform_SourceId_key] UNIQUE NONCLUSTERED ([Platform],[SourceId])
);

-- CreateTable
CREATE TABLE [dbo].[DownloadJobs] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DownloadJobs_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER,
    [GuestFingerprint] NVARCHAR(64),
    [MediaSourceId] UNIQUEIDENTIFIER NOT NULL,
    [Status] NVARCHAR(20) NOT NULL CONSTRAINT [DownloadJobs_Status_df] DEFAULT 'queued',
    [Quality] NVARCHAR(20) NOT NULL,
    [Format] NVARCHAR(10) NOT NULL,
    [IncludeSubtitles] BIT NOT NULL CONSTRAINT [DownloadJobs_IncludeSubtitles_df] DEFAULT 0,
    [IncludeThumbnail] BIT NOT NULL CONSTRAINT [DownloadJobs_IncludeThumbnail_df] DEFAULT 1,
    [TargetCollectionId] UNIQUEIDENTIFIER,
    [ProgressPercent] DECIMAL(5,2) NOT NULL CONSTRAINT [DownloadJobs_ProgressPercent_df] DEFAULT 0,
    [DownloadedBytes] BIGINT NOT NULL CONSTRAINT [DownloadJobs_DownloadedBytes_df] DEFAULT 0,
    [TotalBytes] BIGINT,
    [SpeedBytesPerSec] BIGINT,
    [EtaSeconds] INT,
    [Attempts] TINYINT NOT NULL CONSTRAINT [DownloadJobs_Attempts_df] DEFAULT 0,
    [ErrorCode] NVARCHAR(40),
    [ErrorMessage] NVARCHAR(500),
    [StartedAt] DATETIME2,
    [CompletedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DownloadJobs_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DownloadJobs_UpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DownloadJobs_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateTable
CREATE TABLE [dbo].[LibraryItems] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [LibraryItems_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [DownloadJobId] UNIQUEIDENTIFIER,
    [MediaSourceId] UNIQUEIDENTIFIER NOT NULL,
    [Title] NVARCHAR(500) NOT NULL,
    [Notes] NVARCHAR(max),
    [FilePath] NVARCHAR(600) NOT NULL,
    [FileSizeBytes] BIGINT NOT NULL CONSTRAINT [LibraryItems_FileSizeBytes_df] DEFAULT 0,
    [Format] NVARCHAR(10) NOT NULL,
    [Quality] NVARCHAR(20) NOT NULL,
    [IsFavorite] BIT NOT NULL CONSTRAINT [LibraryItems_IsFavorite_df] DEFAULT 0,
    [FileMissing] BIT NOT NULL CONSTRAINT [LibraryItems_FileMissing_df] DEFAULT 0,
    [DeletedAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [LibraryItems_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [LibraryItems_UpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [LibraryItems_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [LibraryItems_DownloadJobId_key] UNIQUE NONCLUSTERED ([DownloadJobId])
);

-- CreateTable
CREATE TABLE [dbo].[Collections] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Collections_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(80) NOT NULL,
    [ColorTag] NVARCHAR(20) NOT NULL CONSTRAINT [Collections_ColorTag_df] DEFAULT '#8A6D6D',
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Collections_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Collections_UpdatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Collections_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [Collections_UserId_Name_key] UNIQUE NONCLUSTERED ([UserId],[Name])
);

-- CreateTable
CREATE TABLE [dbo].[CollectionItems] (
    [CollectionId] UNIQUEIDENTIFIER NOT NULL,
    [LibraryItemId] UNIQUEIDENTIFIER NOT NULL,
    [AddedAt] DATETIME2 NOT NULL CONSTRAINT [CollectionItems_AddedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CollectionItems_pkey] PRIMARY KEY CLUSTERED ([CollectionId],[LibraryItemId])
);

-- CreateTable
CREATE TABLE [dbo].[Tags] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Tags_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(40) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Tags_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Tags_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [Tags_UserId_Name_key] UNIQUE NONCLUSTERED ([UserId],[Name])
);

-- CreateTable
CREATE TABLE [dbo].[LibraryItemTags] (
    [LibraryItemId] UNIQUEIDENTIFIER NOT NULL,
    [TagId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [LibraryItemTags_pkey] PRIMARY KEY CLUSTERED ([LibraryItemId],[TagId])
);

-- CreateTable
CREATE TABLE [dbo].[UsageCounters] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [UsageCounters_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [PeriodStart] DATE NOT NULL,
    [DownloadsUsed] INT NOT NULL CONSTRAINT [UsageCounters_DownloadsUsed_df] DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [UsageCounters_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UsageCounters_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [UsageCounters_UserId_PeriodStart_key] UNIQUE NONCLUSTERED ([UserId],[PeriodStart])
);

-- CreateTable
CREATE TABLE [dbo].[GuestUsage] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [GuestUsage_Id_df] DEFAULT newsequentialid(),
    [Fingerprint] NVARCHAR(64) NOT NULL,
    [DownloadsUsed] INT NOT NULL CONSTRAINT [GuestUsage_DownloadsUsed_df] DEFAULT 0,
    [PeriodStart] DATE NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [GuestUsage_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [GuestUsage_pkey] PRIMARY KEY CLUSTERED ([Id]),
    CONSTRAINT [GuestUsage_Fingerprint_PeriodStart_key] UNIQUE NONCLUSTERED ([Fingerprint],[PeriodStart])
);

-- CreateTable
CREATE TABLE [dbo].[Notifications] (
    [Id] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Notifications_Id_df] DEFAULT newsequentialid(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Type] NVARCHAR(40) NOT NULL,
    [Payload] NVARCHAR(max) NOT NULL CONSTRAINT [Notifications_Payload_df] DEFAULT '{}',
    [ReadAt] DATETIME2,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Notifications_CreatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Notifications_pkey] PRIMARY KEY CLUSTERED ([Id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Sessions_UserId_RevokedAt_idx] ON [dbo].[Sessions]([UserId], [RevokedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Sessions_RefreshTokenHash_idx] ON [dbo].[Sessions]([RefreshTokenHash]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PasswordResetTokens_UserId_idx] ON [dbo].[PasswordResetTokens]([UserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EmailVerificationCodes_UserId_idx] ON [dbo].[EmailVerificationCodes]([UserId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DownloadJobs_UserId_Status_CreatedAt_idx] ON [dbo].[DownloadJobs]([UserId], [Status], [CreatedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DownloadJobs_Status_CreatedAt_idx] ON [dbo].[DownloadJobs]([Status], [CreatedAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LibraryItems_UserId_DeletedAt_CreatedAt_idx] ON [dbo].[LibraryItems]([UserId], [DeletedAt], [CreatedAt] DESC);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LibraryItems_UserId_IsFavorite_idx] ON [dbo].[LibraryItems]([UserId], [IsFavorite]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notifications_UserId_ReadAt_CreatedAt_idx] ON [dbo].[Notifications]([UserId], [ReadAt], [CreatedAt] DESC);

-- AddForeignKey
ALTER TABLE [dbo].[UserPreferences] ADD CONSTRAINT [UserPreferences_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Sessions] ADD CONSTRAINT [Sessions_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PasswordResetTokens] ADD CONSTRAINT [PasswordResetTokens_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EmailVerificationCodes] ADD CONSTRAINT [EmailVerificationCodes_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TwoFactorSecrets] ADD CONSTRAINT [TwoFactorSecrets_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DownloadJobs] ADD CONSTRAINT [DownloadJobs_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DownloadJobs] ADD CONSTRAINT [DownloadJobs_MediaSourceId_fkey] FOREIGN KEY ([MediaSourceId]) REFERENCES [dbo].[MediaSources]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LibraryItems] ADD CONSTRAINT [LibraryItems_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LibraryItems] ADD CONSTRAINT [LibraryItems_DownloadJobId_fkey] FOREIGN KEY ([DownloadJobId]) REFERENCES [dbo].[DownloadJobs]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LibraryItems] ADD CONSTRAINT [LibraryItems_MediaSourceId_fkey] FOREIGN KEY ([MediaSourceId]) REFERENCES [dbo].[MediaSources]([Id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Collections] ADD CONSTRAINT [Collections_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CollectionItems] ADD CONSTRAINT [CollectionItems_CollectionId_fkey] FOREIGN KEY ([CollectionId]) REFERENCES [dbo].[Collections]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CollectionItems] ADD CONSTRAINT [CollectionItems_LibraryItemId_fkey] FOREIGN KEY ([LibraryItemId]) REFERENCES [dbo].[LibraryItems]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LibraryItemTags] ADD CONSTRAINT [LibraryItemTags_LibraryItemId_fkey] FOREIGN KEY ([LibraryItemId]) REFERENCES [dbo].[LibraryItems]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LibraryItemTags] ADD CONSTRAINT [LibraryItemTags_TagId_fkey] FOREIGN KEY ([TagId]) REFERENCES [dbo].[Tags]([Id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UsageCounters] ADD CONSTRAINT [UsageCounters_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Notifications] ADD CONSTRAINT [Notifications_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

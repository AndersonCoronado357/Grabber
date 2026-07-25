import type { Prisma, User, UserPreferences } from '@prisma/client';

/** DTO del usuario con los nombres que el frontend ya consume. */
export function userDto(user: User) {
  return {
    id: user.Id,
    name: user.DisplayName ?? user.Username,
    username: user.Username,
    email: user.Email,
    bio: user.Bio ?? '',
    hasAvatar: !!user.AvatarPath,
    avatarUrl: user.AvatarPath ? `/api/v1/me/avatar` : null,
    plan: user.Plan === 'pro' ? 'Pro' : user.Plan === 'studio' ? 'Studio' : 'Free',
    emailVerified: !!user.EmailVerifiedAt,
    initials: (user.DisplayName ?? user.Username)
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    memberSince: user.CreatedAt,
  };
}

/** Preferencias con la forma del mock: language/timezone/quality/format/filename/concurrency/autoTrash. */
export function prefsDto(p: UserPreferences) {
  return {
    theme: p.Theme,
    language: p.Locale,
    timezone: p.Timezone,
    quality: p.DefaultQuality,
    format: p.DefaultFormat,
    filename: p.FilenameTemplate,
    concurrency: String(p.ConcurrentDownloads),
    autoTrash: p.AutoPurgeTrash ? '30 días' : 'Nunca',
    notifications: safeJson(p.NotificationSettings),
  };
}

export function defaultNotificationSettings() {
  return {
    done: { email: true, push: true, app: true },
    error: { email: true, push: false, app: true },
    features: { email: false, push: false, app: true },
    weekly: { email: true, push: false, app: false },
    billing: { email: true, push: false, app: true },
  };
}

function safeJson(s: string): unknown {
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0
      ? parsed
      : defaultNotificationSettings();
  } catch {
    return defaultNotificationSettings();
  }
}

export type UserWithPrefs = Prisma.UserGetPayload<{ include: { Preferences: true } }>;

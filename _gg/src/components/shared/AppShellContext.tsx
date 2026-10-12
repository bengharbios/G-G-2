'use client';

import { createContext, useContext } from 'react';

/**
 * AppShellContext — يتيح للصفحات الوصول إلى حالة المستخدم ومركز التحكم
 * في الهيدر/الأزرار السفلية الموحّدة (AppShell).
 *
 * الميزّات:
 * - authUser: المستخدم الحالي (أو null إن لم يسجّل الدخول)
 * - openProfile: يفتح نافذة بروفايلي (YallaProfileDialog)
 * - openLogin / openRegister: يفتح نوافذ الدخول/التسجيل
 * - handleLogout: تسجيل الخروج
 * - subscriberProfile: بيانات اشتراك المستخدم (إن وجدت)
 */

export interface AppShellUser {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  country?: string;
  role?: string;
  numericId?: number | null;
  frame?: string;
  ornament?: string;
  card?: string;
  cover?: string;
}

export interface SubscriberProfile {
  subscriber?: {
    subscriptionCode?: string;
    plan?: string;
    isTrial?: boolean;
    allowedGames?: string[];
    maxSessions?: number;
    expiresAt?: string;
  };
}

export interface AppShellContextValue {
  authUser: AppShellUser | null;
  openProfile: () => void;
  openLogin: () => void;
  openRegister: () => void;
  handleLogout: () => Promise<void> | void;
  subscriberProfile: SubscriberProfile | null;
  /** يحدّث بيانات المستخدم بعد تعديل البروفايل */
  onProfileUpdated?: (patch: Partial<AppShellUser>) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue | null {
  return useContext(AppShellContext);
}

export { AppShellContext };

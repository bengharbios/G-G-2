/**
 * chat-emojis-gifts.ts — قوائم مشتركة للإيموجي والهدايا في دردشة الأصدقاء.
 *
 * - EMOJI_LIST: قائمة شاملة بـ 120+ إيموجي مقسّمة إلى فئات
 * - GIFTS: قائمة الهدايا مع معرّفاتها وأسعارها وصورها (مُعاد تصديرها من voice-rooms/types)
 * - emojiToPng(emoji): يحوّل رمز إيموجي إلى رابط PNG من GitHub emoji CDN
 *                       (ضمان一致性 العرض بين كل الأجهزة)
 * - getGiftById(id): يجلب هدية من القائمة بمعرّفها
 * - isGiftMessage(text): يكشف إن كانت رسالة نصية تحتوي معرّف هدية (gift:g1)
 * - parseGiftId(text): يستخرج معرّف الهدية من نص رسالة
 */

import { DEFAULT_GIFTS, GIFT_CATEGORIES, GIFT_ASSETS, type Gift } from '@/app/voice-rooms/types';

export type { Gift } from '@/app/voice-rooms/types';
export { DEFAULT_GIFTS, GIFT_CATEGORIES, GIFT_ASSETS };

// ─── Categories of emojis ─────────────────────────────────────────────────────
export type EmojiCategory = {
  id: string;
  label: string;
  emojis: string[];
};

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    label: 'وجوه',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
      '🤢', '🤮', '🥵', '🥶', '😵', '🤯', '🤠', '🥳',
      '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯',
      '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
      '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩',
      '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
    ],
  },
  {
    id: 'gestures',
    label: 'إيماءات',
    emojis: [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋',
      '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💪',
      '🦾', '👏', '🙌', '👐', '🤲', '🤜', '🤛', '✊',
      '👊', '🫶', '🫰', '🤳',
    ],
  },
  {
    id: 'hearts',
    label: 'قلوب',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '♥️', '💌', '💍', '💎', '🔥',
    ],
  },
  {
    id: 'animals',
    label: 'حيوانات',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
      '🦗', '🕷️', '🦂', '🦕', '🦖', '🐙', '🦑', '🦐',
      '🦀', '🐠', '🐟', '🐡', '🦈', '🐬', '🐳', '🐋',
    ],
  },
  {
    id: 'food',
    label: 'طعام',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑',
      '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
      '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
      '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔',
      '🍟', '🍕', '🥪', '🌮', '🌯', '🥙', '🧆', '🥗',
      '🍿', '🍫', '🍬', '🍭', '🍮', '🍯', '🍰', '🎂',
      '🧁', '🥧', '🍦', '🍨', '☕', '🍵', '🧃', '🥤',
      '🍺', '🍻', '🥃', '🍷', '🥂', '🍸', '🍹', '🍾',
    ],
  },
  {
    id: 'activities',
    label: 'نشاطات',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🥅', '🎯',
      '⛳', '🎮', '🎲', '🎰', '🎳', '🏆', '🥇', '🥈',
      '🥉', '🎽', '🥋', '🎪', '🎨', '🎭', '🎤', '🎧',
      '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎬',
    ],
  },
  {
    id: 'symbols',
    label: 'رموز',
    emojis: [
      '✨', '🎉', '🎊', '🎈', '🎁', '🎀', '🏮', '🎗️',
      '🚀', '⭐', '🌟', '💫', '⚡', '💥', '💢',
      '💦', '💨', '🕳️', '💣', '💬', '💭', '🗯️', '♨️',
      '🌈', '☀️', '🌙', '⛅', '☁️', '🌧️', '⛈️', '🌩️',
      '❄️', '☃️', '⛄', '🔥', '✅', '❌', '❎', '✔️',
      '➕', '➖', '❗', '❓', '⚠️', '🚫', '🔝', '🔙',
    ],
  },
];

// Flattened list of all emojis (for backward-compat / quick access)
export const ALL_EMOJIS: string[] = EMOJI_CATEGORIES.flatMap(c => c.emojis);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * يحوّل رمز إيموجي إلى رابط PNG محلي من public/emojis/.
 * يضمن一致性 العرض بين كل الأجهزة والمتصفّحات (لا يعتمد على خط النظام).
 * كل ملفات PNG محلية — لا أي ارتباط بأي CDN خارجي.
 */
export function emojiToPng(emoji: string): string {
  // أزل المعدّلات/المُنتِجات المركّبة (variations selectors) حتى لا تُكسر اسم الملف
  const cleaned = emoji.replace(/[\uFE0E\uFE0F]/g, '');
  const codePoints: string[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const cp = cleaned.codePointAt(i);
    if (cp === undefined) continue;
    codePoints.push(cp.toString(16));
    // تخطّي البايت الثاني للأحرف المركّبة (surrogate pairs)
    if (cp > 0xFFFF) i++;
  }
  return `/emojis/${codePoints.join('-').toLowerCase()}.png`;
}

/** يبحث عن هدية بمعرّفها في DEFAULT_GIFTS */
export function getGiftById(id: string): Gift | undefined {
  return DEFAULT_GIFTS.find(g => g.id === id);
}

/** يكشف إن كان نص الرسالة يحتوي معرّف هدية (gift:g1) */
export function isGiftMessage(text: string): boolean {
  return text.startsWith('gift:') && text.length > 5;
}

/** يستخرج معرّف الهدية من نص رسالة (مثل 'gift:g1' → 'g1') */
export function parseGiftId(text: string): string | null {
  if (!isGiftMessage(text)) return null;
  return text.slice(6); // 'gift:'.length === 6 (5 + colon)
}

/**
 * يبني رابط الصورة المعروضة للهدية:
 * - thumb إن وُجد (للهدايا ذات SVGA/MP4)
 * - giftImageUrl إن وُجد (للهدايا المخصّصة)
 * - emojiPng(emoji) كاحتياطي
 */
export function getGiftImageUrl(gift: Gift): string {
  if (gift.thumb) return gift.thumb;
  if (gift.giftImageUrl) return gift.giftImageUrl;
  return emojiToPng(gift.emoji);
}

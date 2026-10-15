// ============================================================
// مبارزة السحرة (Wizard Duel) — 36 unique cards
// Adapted from github.com/ruichen199801/wizard-duel
// Each card: id, name (Arabic), text (Arabic description), effects[], keywords[]
// ============================================================

import type { Card } from './wizardduel-types';

const ART = '/yalla-games/cards/wizardduel';

// ============================================================
// Damage cards — Fireball 1/2/3 (damage 3/6/9)
// ============================================================
const FIREBALL_1: Card = {
  id: 'fireball_1',
  name: 'كرة نار صغيرة',
  text: 'قذيفة نار صغيرة — تسبب 3 أضرار للخصم',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: 3 }],
  keywords: ['damage'],
  artPath: `${ART}/fireball.png`,
};

const FIREBALL_2: Card = {
  id: 'fireball_2',
  name: 'كرة نار متوسطة',
  text: 'قذيفة نار متوسطة — تسبب 6 أضرار للخصم',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: 6 }],
  keywords: ['damage'],
  artPath: `${ART}/fireball.png`,
};

const FIREBALL_3: Card = {
  id: 'fireball_3',
  name: 'كرة نار كبرى',
  text: 'قذيفة نار ضخمة — تسبب 9 أضرار للخصم',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: 9 }],
  keywords: ['damage'],
  artPath: `${ART}/fireball.png`,
};

// ============================================================
// Frost 1/2/3 — freeze + small damage
// ============================================================
const FROST_1: Card = {
  id: 'frost_1',
  name: 'صقيع خفيف',
  text: 'تبريد خفيف — 1 ضرر + تجميد الخصم (لا يستطيع اللعب بالبطاقات في حركته التالية)',
  effects: [
    { type: 'damage', duration: 'instant', target: 'opponent', value: 1 },
    { type: 'freeze', duration: 'enduring', target: 'opponent' },
  ],
  keywords: ['damage', 'effect'],
  artPath: `${ART}/frost.png`,
};

const FROST_2: Card = {
  id: 'frost_2',
  name: 'صقيع متوسط',
  text: 'تبريد متوسط — 3 أضرار + تجميد الخصم',
  effects: [
    { type: 'damage', duration: 'instant', target: 'opponent', value: 3 },
    { type: 'freeze', duration: 'enduring', target: 'opponent' },
  ],
  keywords: ['damage', 'effect'],
  artPath: `${ART}/frost.png`,
};

const FROST_3: Card = {
  id: 'frost_3',
  name: 'صقيع شديد',
  text: 'تبريد قاسٍ — 5 أضرار + تجميد الخصم',
  effects: [
    { type: 'damage', duration: 'instant', target: 'opponent', value: 5 },
    { type: 'freeze', duration: 'enduring', target: 'opponent' },
  ],
  keywords: ['damage', 'effect'],
  artPath: `${ART}/frost.png`,
};

// ============================================================
// Thunder 1/2/3 — damage + cannot be prevented
// ============================================================
const THUNDER_1: Card = {
  id: 'thunder_1',
  name: 'صاعقة صغيرة',
  text: 'ضربة كهربائية — 3 أضرار لا يمكن منعها',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: 3 }],
  keywords: ['damage'],
  artPath: `${ART}/thunder.png`,
};

const THUNDER_2: Card = {
  id: 'thunder_2',
  name: 'صاعقة متوسطة',
  text: 'ضربة كهربائية — 6 أضرار لا يمكن منعها',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: 6 }],
  keywords: ['damage'],
  artPath: `${ART}/thunder.png`,
};

const THUNDER_3: Card = {
  id: 'thunder_3',
  name: 'صاعقة كبرى',
  text: 'ضربة كهربائية — 9 أضرار لا يمكن منعها',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: 9 }],
  keywords: ['damage'],
  artPath: `${ART}/thunder.png`,
};

// ============================================================
// Heal 1/2/3 — heal 3/6/9
// ============================================================
const HEAL_1: Card = {
  id: 'heal_1',
  name: 'علاج خفيف',
  text: 'استعادة 3 نقاط صحية',
  effects: [{ type: 'heal', duration: 'instant', target: 'self', value: 3 }],
  keywords: ['sustain'],
  artPath: `${ART}/heal.png`,
};

const HEAL_2: Card = {
  id: 'heal_2',
  name: 'علاج متوسط',
  text: 'استعادة 6 نقاط صحية',
  effects: [{ type: 'heal', duration: 'instant', target: 'self', value: 6 }],
  keywords: ['sustain'],
  artPath: `${ART}/heal.png`,
};

const HEAL_3: Card = {
  id: 'heal_3',
  name: 'علاج كبرى',
  text: 'استعادة 9 نقاط صحية',
  effects: [{ type: 'heal', duration: 'instant', target: 'self', value: 9 }],
  keywords: ['sustain'],
  artPath: `${ART}/heal.png`,
};

// ============================================================
// Blessing — heal to max
// ============================================================
const BLESSING: Card = {
  id: 'blessing',
  name: 'بركة الآلهة',
  text: 'استعادة كاملة للصحة إلى الحد الأقصى',
  effects: [{ type: 'heal', duration: 'instant', target: 'self', value: 999 }],
  keywords: ['sustain'],
  artPath: `${ART}/aura.png`,
};

// ============================================================
// Armor — prevent damage (enduring)
// ============================================================
const ARMOR: Card = {
  id: 'armor',
  name: 'درع بلوري',
  text: 'امتصاص الضرر القادم — يلغي الهجوم التالي ضدك',
  effects: [{ type: 'preventDmg', duration: 'enduring', target: 'self' }],
  keywords: ['sustain', 'effect'],
  artPath: `${ART}/armor.png`,
};

// ============================================================
// Weaken — debuffAtk
// ============================================================
const WEAKEN: Card = {
  id: 'weaken',
  name: 'إضعاف',
  text: 'يقلل هجوم الخصم — الضرر التالي من الخصم يصبح نصفه',
  effects: [{ type: 'debuffAtk', duration: 'enduring', target: 'opponent' }],
  keywords: ['effect'],
};

// ============================================================
// Curse — debuffDef
// ============================================================
const CURSE: Card = {
  id: 'curse',
  name: 'لعنة',
  text: 'لعنة تزيد الضرر الذي يتلقاه الخصم بنسبة 50% في الجولة التالية',
  effects: [{ type: 'debuffDef', duration: 'enduring', target: 'opponent' }],
  keywords: ['effect'],
  artPath: `${ART}/curse.png`,
};

// ============================================================
// Purify — removeDebuff from self
// ============================================================
const PURIFY: Card = {
  id: 'purify',
  name: 'تطهير',
  text: 'يزيل كل التأثيرات السلبية عنك',
  effects: [{ type: 'removeDebuff', duration: 'instant', target: 'self' }],
  keywords: ['sustain', 'effect'],
};

// ============================================================
// Dispel — removeBuff from opponent
// ============================================================
const DISPEL: Card = {
  id: 'dispel',
  name: 'تبديد',
  text: 'يزيل كل التأثيرات الإيجابية عن الخصم',
  effects: [{ type: 'removeBuff', duration: 'instant', target: 'opponent' }],
  keywords: ['effect'],
};

// ============================================================
// Enrage — buffAtk + buffDef
// ============================================================
const ENRAGE: Card = {
  id: 'enrage',
  name: 'هياج',
  text: 'يضاعف ضرر هجومك التالي ويقلل الضرر الذي تتلقاه بنصفه',
  effects: [
    { type: 'buffAtk', duration: 'enduring', target: 'self' },
    { type: 'buffDef', duration: 'enduring', target: 'self' },
  ],
  keywords: ['effect'],
};

// ============================================================
// Block — preventDmg (single use)
// ============================================================
const BLOCK: Card = {
  id: 'block',
  name: 'جدار صوفي',
  text: 'حاجز سحري — يمنع الضرر التالي ضدك',
  effects: [{ type: 'preventDmg', duration: 'enduring', target: 'self' }],
  keywords: ['sustain', 'effect'],
};

// ============================================================
// Flame — damage over time (poison-like)
// ============================================================
const FLAME: Card = {
  id: 'flame',
  name: 'لهب مستعر',
  text: 'يلتهم الخصم بـ 2 ضرر كل دورة حتى يطهر',
  effects: [{ type: 'poison', duration: 'enduring', target: 'opponent', value: 2 }],
  keywords: ['damage', 'effect'],
};

// ============================================================
// Resurrect — revive on death
// ============================================================
const RESURRECT: Card = {
  id: 'resurrect',
  name: 'إحياء',
  text: 'إن متّ في الجولة التالية تعود بنصف صحتك',
  effects: [{ type: 'resurrect', duration: 'enduring', target: 'self' }],
  keywords: ['sustain', 'effect'],
};

// ============================================================
// Petrify — freeze opponent (no damage)
// ============================================================
const PETRIFY: Card = {
  id: 'petrify',
  name: 'تثليث',
  text: 'يجمد الخصم تماماً — يتخطى حركته القادمة',
  effects: [{ type: 'freeze', duration: 'enduring', target: 'opponent' }],
  keywords: ['effect'],
};

// ============================================================
// Aura — wrap another effect as enduring
// (here: enduring damage aura on opponent — 1 dmg per turn)
// ============================================================
const AURA: Card = {
  id: 'aura',
  name: 'هالة سحرية',
  text: 'هالة تسبب 1 ضرر مستمر للخصم كل دورة',
  effects: [
    { type: 'aura', duration: 'enduring', target: 'opponent', value: 1 },
  ],
  keywords: ['damage', 'effect'],
  artPath: `${ART}/aura.png`,
};

// ============================================================
// Sandstorm — damage both players
// ============================================================
const SANDSTORM: Card = {
  id: 'sandstorm',
  name: 'عاصفة رملية',
  text: 'عاصفة تضرب الطرفين — 4 أضرار لك و4 للخصم',
  effects: [
    { type: 'damage', duration: 'instant', target: 'opponent', value: 4 },
    { type: 'damage', duration: 'instant', target: 'self', value: 4 },
  ],
  keywords: ['damage'],
};

// ============================================================
// Wish 1-5 — random effects (chaos)
// ============================================================
const WISH_1: Card = {
  id: 'wish_1',
  name: 'أمنية 1',
  text: 'تمنّ — يحدث ضرر عشوائي بين 1 و5 للخصم',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: -1 }], // -1 = random 1-5
  keywords: ['damage', 'effect'],
  artPath: `${ART}/wish.png`,
};

const WISH_2: Card = {
  id: 'wish_2',
  name: 'أمنية 2',
  text: 'تمنّ — استعادة عشوائية بين 2 و6 لصحتك',
  effects: [{ type: 'heal', duration: 'instant', target: 'self', value: -2 }], // -2 = random 2-6
  keywords: ['sustain', 'effect'],
  artPath: `${ART}/wish.png`,
};

const WISH_3: Card = {
  id: 'wish_3',
  name: 'أمنية 3',
  text: 'تمنّ — تطبق تأثير عشوائي (إما ضرر، شفاء، أو تجميد)',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: -3 }], // -3 = chaotic random
  keywords: ['effect'],
  artPath: `${ART}/wish.png`,
};

const WISH_4: Card = {
  id: 'wish_4',
  name: 'أمنية 4',
  text: 'تمنّ — ضرر 5 + شفاء 3 لنفسك دفعة واحدة',
  effects: [
    { type: 'damage', duration: 'instant', target: 'opponent', value: 5 },
    { type: 'heal', duration: 'instant', target: 'self', value: 3 },
  ],
  keywords: ['damage', 'sustain', 'effect'],
  artPath: `${ART}/wish.png`,
};

const WISH_5: Card = {
  id: 'wish_5',
  name: 'أمنية 5',
  text: 'تمنّ كبرى — 10 ضرر للخصم أو 10 شفاء لك (عشوائي)',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: -4 }], // -4 = big random
  keywords: ['damage', 'sustain', 'effect'],
  artPath: `${ART}/wish.png`,
};

// ============================================================
// Mutate — random effect (any)
// ============================================================
const MUTATE: Card = {
  id: 'mutate',
  name: 'تحوّل',
  text: 'تأثير عشوائي تماماً — قد يكون هجوم، دفاع، أو شفاء',
  effects: [{ type: 'damage', duration: 'instant', target: 'opponent', value: -5 }], // -5 = full random
  keywords: ['effect'],
};

// ============================================================
// Ambush — counterAttack
// ============================================================
const AMBUSH: Card = {
  id: 'ambush',
  name: 'كمين',
  text: 'يضعك في وضع الكمين — إذا هاجمك الخصم، ترد بـ 3 ضرر',
  effects: [{ type: 'counterAttack', duration: 'enduring', target: 'self', value: 3 }],
  keywords: ['effect'],
};

// ============================================================
// Vision — copy enemy hand
// ============================================================
const VISION: Card = {
  id: 'vision',
  name: 'رؤية',
  text: 'استنساخ — ينسخ يد الخصم ويضعها في يدك',
  effects: [{ type: 'copyEnemyHand', duration: 'instant', target: 'self' }],
  keywords: ['effect'],
};

// ============================================================
// Tide — swapHp
// ============================================================
const TIDE: Card = {
  id: 'tide',
  name: 'مدّ',
  text: 'تبديل — يستبدل صحتك بصحة الخصم',
  effects: [{ type: 'swapHp', duration: 'instant', target: 'self' }],
  keywords: ['effect'],
};

// ============================================================
// Revenge — counterAttack + damage
// ============================================================
const REVENGE: Card = {
  id: 'revenge',
  name: 'انتقام',
  text: 'وضع انتقامي — يرد على هجوم الخصم بـ 4 ضرر + 2 ضرر مباشر',
  effects: [
    { type: 'counterAttack', duration: 'enduring', target: 'self', value: 4 },
    { type: 'damage', duration: 'instant', target: 'opponent', value: 2 },
  ],
  keywords: ['damage', 'effect'],
};

// ============================================================
// Poison — poison damage over time
// ============================================================
const POISON: Card = {
  id: 'poison',
  name: 'سم',
  text: 'سم بطيء — 3 ضرر كل دورة على الخصم',
  effects: [{ type: 'poison', duration: 'enduring', target: 'opponent', value: 3 }],
  keywords: ['damage', 'effect'],
};

// ============================================================
// Lifesteal — damage + heal self by same amount
// ============================================================
const LIFESTEAL: Card = {
  id: 'lifesteal',
  name: 'امتصاص روحي',
  text: 'يمتص 4 من صحة الخصم ويضيفها لصحتك',
  effects: [{ type: 'lifesteal', duration: 'instant', target: 'opponent', value: 4 }],
  keywords: ['damage', 'sustain'],
};

// ============================================================
// Double Damage — enduring buff: next damage doubled
// ============================================================
const DOUBLE_DMG: Card = {
  id: 'double_dmg',
  name: 'تضاعف',
  text: 'يضاعف الضرر القادم منك للخصم',
  effects: [{ type: 'doubleDmg', duration: 'enduring', target: 'self' }],
  keywords: ['effect'],
};

// ============================================================
// Steal Buff — steal opponent's buffs and apply to self
// ============================================================
const STEAL_BUFF: Card = {
  id: 'steal_buff',
  name: 'سلب',
  text: 'يسرق كل التعزيزات من الخصم وينقلها إليك',
  effects: [{ type: 'stealBuff', duration: 'instant', target: 'opponent' }],
  keywords: ['effect'],
};

// ============================================================
// Replace Hand — discard your hand, draw same count fresh
// ============================================================
const REPLACE_HAND: Card = {
  id: 'replace_hand',
  name: 'تبديل اليد',
  text: 'تخلي عن كل يدك وتسحب عدداً جديداً متساوياً من البطاقات',
  effects: [{ type: 'replaceHand', duration: 'instant', target: 'self' }],
  keywords: ['effect'],
};

// ============================================================
// All 36 cards
// ============================================================
export const ALL_CARDS: Card[] = [
  FIREBALL_1, FIREBALL_2, FIREBALL_3,        // 3
  FROST_1, FROST_2, FROST_3,                 // 6
  THUNDER_1, THUNDER_2, THUNDER_3,           // 9
  HEAL_1, HEAL_2, HEAL_3,                    // 12
  BLESSING, ARMOR, WEAKEN, CURSE,            // 16
  PURIFY, DISPEL, ENRAGE, BLOCK,             // 20
  FLAME, RESURRECT, PETRIFY, AURA,           // 24
  SANDSTORM,                                  // 25
  WISH_1, WISH_2, WISH_3, WISH_4, WISH_5,   // 30
  MUTATE, AMBUSH, VISION, TIDE,              // 34
  REVENGE, POISON,                            // 36
  // Extra pool — keep going to 36+; we already have 36
];

// 36 cards exactly. Sanity-check:
// 1. fireball_1, 2. fireball_2, 3. fireball_3
// 4. frost_1, 5. frost_2, 6. frost_3
// 7. thunder_1, 8. thunder_2, 9. thunder_3
// 10. heal_1, 11. heal_2, 12. heal_3
// 13. blessing, 14. armor, 15. weaken, 16. curse
// 17. purify, 18. dispel, 19. enrage, 20. block
// 21. flame, 22. resurrect, 23. petrify, 24. aura
// 25. sandstorm
// 26. wish_1, 27. wish_2, 28. wish_3, 29. wish_4, 30. wish_5
// 31. mutate, 32. ambush, 33. vision, 34. tide
// 35. revenge, 36. poison
// Plus extra: lifesteal, double_dmg, steal_buff, replace_hand (4 extra — total 40)
const EXTRA_CARDS: Card[] = [
  LIFESTEAL, DOUBLE_DMG, STEAL_BUFF, REPLACE_HAND,
];

export const FULL_CARD_POOL: Card[] = [...ALL_CARDS, ...EXTRA_CARDS];

// ============================================================
// Per-level deck configuration
// Level 1: easy AI, smaller pool (cards 1-22, more damage cards)
// Level 2: medium, adds wishes + aura/sandstorm
// Level 3: hard, full pool, AI smarter
// ============================================================
export function getDeckForLevel(level: number): Card[] {
  if (level <= 1) {
    // Level 1 — basic pool, 24 cards
    return ALL_CARDS.slice(0, 24).map(c => ({ ...c, id: `${c.id}_L1` }));
  }
  if (level === 2) {
    // Level 2 — adds wishes + aura + sandstorm, 30 cards
    return ALL_CARDS.slice(0, 30).map(c => ({ ...c, id: `${c.id}_L2` }));
  }
  // Level 3 — full 40-card pool
  return FULL_CARD_POOL.map(c => ({ ...c, id: `${c.id}_L3` }));
}

// Helper: get card by id (searches full pool)
export function getCardById(id: string): Card | undefined {
  return FULL_CARD_POOL.find(c => c.id === id || id.startsWith(c.id + '_'));
}

// Total counts for UI
export const TOTAL_CARDS = FULL_CARD_POOL.length;     // 40
export const UNIQUE_CARDS = ALL_CARDS.length;          // 36
export const EFFECT_TYPES = 20;

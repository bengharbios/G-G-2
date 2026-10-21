# STORE_SPEC.md — متجر Yalla Ludo (Store)

> **الدفعة 1**: تدقيق فقط — لا كود. المرجع: A1-A4 + السورس.

---

## 0) تقرير التدقيق

### 0-A) الأقسام في السورس (من layout XML)

المصدر الرئيسي: `fragment_skin.xml` — نافذة المتجر (Skin Shop) بـ 4 تبويبات:

| # | التبويب | id | الأيقونة (uncheck) | النص (string) | الصفحة/الديالوج |
|---|---|---|---|---|---|
| 1 | Dice (نرد) | ll_dice | dice_uncheck.webp | @string/dice | dialog_skin_dice.xml |
| 2 | Token (رمز) | ll_token | token_uncheck.webp | @string/token | — (داخل نفس fragment) |
| 3 | Bubble (فقاعة) | ll_bubble | bubble_uncheck.webp | @string/bubble | — (داخل نفس fragment) |
| 4 | Theme (موضوع) | ll_theme | theme_uncheck.webp | @string/theme | dialog_skin_theme.xml |

تبويبات إضافية موجودة كـ dialogs منفصلة:
5. **Cardback (بطاقة الخلفية)** — dialog_cardback_skin.xml + dialog_cardback_skin_royal.xml
6. **Decor (معلقات جدارية)** — dialog_decor_skin.xml + dialog_decor_skin_royal.xml
7. **Jackaroo Skin** — dialog_skin_jackaroo.xml + dialog_skin_jackaroo_royal.xml
8. **Unique ID (معرّف فريد)** — item_unique_id.xml, item_uniqueid_rank.xml
9. **Royal Store items:**
   - Royal Car/Vehicle — dialog_royall_store_car_gift.xml
   - Royal File Card — dialog_royall_file_card.xml
   - Royal Ornament — dialog_royall_ornament.xml
   - Royal Room Theme — dialog_royall_room_theme.xml
   - Royal Skin — dialog_royall_store_skin_detail.xml
10. **Exchange (استبدال)** — fragment_skin_fragment_exchange.xml

**ملاحظة مهمة**: لا يوجد layout في السورس المستخرج (v1.5.1.0) يُطابق صورة A1 (شبكة أقسام على رفوف). هذا التصميم إما:
- من نسخة أحدث من Yalla Ludo غير موجودة في APK المستخرج
- أو مبني ديناميكياً من كود Java (وليس XML layout ثابت)

القرار: نبني صفحة المتجر الرئيسي بناءً على وصف المستخدم (A1) باستخدام أصول السورس المتاحة.

### 0-B) عدد المستويات/الأنواع الفعلية من السورس

من ملفات الأصول:
- 95 ملف `skin_*.webp` (نرد + رمز + فقاعة + مواضيع)
- 78 صورة PNG في `/yalla-frames/` (إطارات لاعب)
- 45 ملف SVGA في `/yalla-frames/svga/` (إطارات متحركة)
- أصول زينة (decor_bg_*, decor_celebrity_main, decor_shop_title)
- أصول بطاقات (cardback, profile_card, head_frame)

---

## 1) جرد بياناتنا الحالية (قبل أي تعديل)

### 1-A) جدول الإطارات (PlayerFrame)

| المعرّف | الاسم | الندرة | السعر | مجاني | المصدر |
|---|---|---|---|---|---|
| 200001-200008 | نجوم الأسطورة 7..577 (8 عناصر) | legendary | 1000 | لا | ours |
| 121023-121027 | حصري رويال 1..5 (5 عناصر) | legendary | 1000 | لا | ours |
| 121017 | VIP — الفارس | epic | 600 | لا | ours |
| 121018 | VIP — اللواء | epic | 600 | لا | ours |
| 110001 | البطل في الترتيب العالمي | epic | 500 | لا | ours |
| 110001-110006 + SVGA (121001-121016, 121019-121025, 121028-121040, 121042) | إطارات SVGA (≈45) | varies | varies | varies | ours |

**الإجمالي**: ~123 إطار (78 PNG + 45 SVGA)

### 1-B) جدول المعلقات (DecorItem — kind=ornament)

| المعرّف | الاسم | الندرة | السعر | مجاني |
|---|---|---|---|---|
| orn_banner | لافتة الاحتفال | rare | 250 | لا |
| orn_lights | أضواء البطولة | epic | 500 | لا |
| orn_sparkle | بريق ذهبي | legendary | 800 | لا |
| hanging_meteors | الشهباء المتساقطة | legendary | 800 | لا |

**الإجمالي**: 4 معلقات

### 1-C) جدول المواضيع (DecorItem — kind=theme)

| المعرّف | الاسم | الندرة | السعر | مجاني |
|---|---|---|---|---|
| /yalla-covers/bg_profile_theme_default.webp | افتراضي | common | 0 | نعم |
| /yalla-games/mafia.png | المافيا | rare | 300 | لا |
| /yalla-games/tobol.png | طبول الحرب | rare | 300 | لا |
| /yalla-games/tabot.png | الهروب من التابوت | rare | 300 | لا |
| /yalla-games/prison.png | السجن | rare | 300 | لا |
| /yalla-games/risk.png | المجازفة | rare | 300 | لا |
| /yalla-games/risk2.png | المجازفة 2 | rare | 300 | لا |
| /yalla-games/familyfeud.png | فاميلي فيود | rare | 300 | لا |
| /yalla-games/baharharb.png | بحر و حرب | rare | 300 | لا |
| /yalla-games/shifarat.png | الشيفرات | rare | 300 | لا |

**الإجمالي**: 10 مواضيع

### 1-D) جدول البطاقات (DecorItem — kind=card)

| المعرّف | الاسم | الندرة | السعر | مجاني |
|---|---|---|---|---|
| card_royal_deer | الغزلان الملكية | legendary | 800 | لا |
| card_golden_love | العشاق الذهبيون | legendary | 800 | لا |
| card_emerald_royal | الزمرد الملكي | legendary | 600 | لا |
| card_astronaut | حديقة الفضاء | epic | 500 | لا |
| card_glow | هالة ضوئية | epic | 500 | لا |
| room_profile_member_bg | بطاقة العضوية | rare | 400 | لا |
| charge_reward_profile_card | بطاقة الشحن | rare | 400 | لا |

**الإجمالي**: 7 بطاقات

### 1-E) المجموع الكلي

| الفئة | العدد |
|---|---|
| إطارات (frames) | ~123 |
| معلقات (ornaments) | 4 |
| مواضيع (themes) | 10 |
| بطاقات (cards) | 7 |
| **المجموع** | **~144** |

---

## 2) جرد صفحات السوبر أدمن الحالية المتعلقة بالمتجر

### 2-A) الصفحات الموجودة

كلها داخل `src/app/admin/page.tsx` كأقسام (sections) — ليست صفحات منفصلة:

| القسم | id | ما تعرضه | مصدر البيانات | API | الصلاحيات |
|---|---|---|---|---|---|
| إدارة الإطارات | `frames` | جدول PlayerFrame (add/edit/delete/toggle active) | PlayerFrame table | GET/POST/PUT/DELETE /api/admin/frames | admin |
| المعلقات الجدارية | `ornaments` | جدول DecorItem WHERE kind='ornament' | DecorItem table | GET/POST/PUT/DELETE /api/admin/decor (مدمج) | admin |
| المواضيع | `themes` | جدول DecorItem WHERE kind='theme' | DecorItem table | نفس API أعلاه | admin |
| البطاقات | `cards` | جدول DecorItem WHERE kind='card' | DecorItem table | نفس API أعلاه | admin |

### 2-B) ما ينقص كل صفحة مقارنة بالمواصفة [8]

| الصفحة | ينقصها |
|---|---|
| frames | حقل Visibility (ظاهر/مخفي/مجدول)، حقل source (ours/imported)، معاينة المتجر، خصومات/عروض، جدولة زمنية |
| ornaments | نفس ما ينقص frames |
| themes | نفس ما ينقص frames |
| cards | نفس ما ينقص frames |
| (لا توجد) | لوحة سوق موحّدة [8-ب] للتحكم في الظهور على مستوى القسم والعنصر |
| (لا توجد) | صفحة سجلات (Logs) للمتجر |
| (لا توجد) | صفحة Inventory للاعبين (منح/سحب/تمديد) |

### 2-C) القرار لكل صفحة

| الصفحة | القرار | السبب |
|---|---|---|
| frames | (ب) تُطوَّر وتُوسَّع | تعمل الآن — نضيف حقول Visibility/source/خصومات فقط |
| ornaments | (ب) تُطوَّر وتُوسَّع | نفس ما فوق |
| themes | (ب) تُطوَّر وتُوسَّع | نفس ما فوق |
| cards | (ب) تُطوَّر وتُوسَّع | نفس ما فوق |
| (لا توجد) | (ج) تُنشأ | لوحة سوق موحّدة [8-ب] كقسم جديد في الأدمن |

**لا تُحذف أي صفحة**. كل التعديلات تضيف فقط ولا تغيّر سلوك الصفحات الحالية.

---

## 3) الأقسام المخطط لها للمتجر الجديد (من السورس + وصف المستخدم)

| # | القسم | الأيقونة (من السورس) | الصفحة | شرط الظهور |
|---|---|---|---|---|
| 1 | إطارات (Frames) | — (موجودة لدينا) | صفحة البطاقات (A2-style) | دائماً |
| 2 | بطاقات (Cards) | — (موجودة لدينا) | صفحة البطاقات | دائماً |
| 3 | معلقات جدارية (Wall Hangings) | decor_shop_title.webp | صفحة المعلقات (A3-style) | دائماً |
| 4 | مواضيع (Themes) | theme_uncheck.webp | صفحة المواضيع (A4-style) | دائماً |
| 5 | غلاف لودو (Ludo Cover) | dice_uncheck.webp | صفحة نرد (dice skins) | دائماً |
| 6 | ملصقات (Stickers) | — (لم يوجد أصل) | TBD | مشروط |
| 7 | بطاقة الملف (Profile Card) | — (موجودة لدينا kind=card) | مدمج مع البطاقات | دائماً |
| 8 | معرّف فريد (Unique ID) | item_unique_id.xml | صفحة معرّف فريد | مشروط |
| 9 | مؤثرات الدخول (Entry Effects) | bubble_uncheck.webp | صفحة فقاعات (bubble skins) | مشروط |
| 10 | مركبة رويال (Royal Vehicle) | dialog_royall_store_car_gift | صفحة مركبات رويال | رويال 3+ |

**النقطة الحمراء (reddot.webp)**: تظهر على قسم "غلاف لودو" عند وجود تحديث/عنصر جديد — شرطها من السورس (في fragment_skin.xml: `iv_dot_dice` visibility=invisible، يصبح visible ديناميكياً).

---

## 4) أصول السورس المستخدمة

| الأصل | المسار | الاستخدام |
|---|---|---|
| skin_bg.9.png | /yalla-ui/full/ | خلفية المتجر |
| skin_divider.9.png | /yalla-ui/full/ | فاصل بين التبويبات والمحتوى |
| skin_close.webp | /yalla-ui/full/ | زر X |
| skin_shop_past.webp | /yalla-ui/full/ | زر السجل/History |
| skin_exchange_icon.webp | /yalla-ui/full/ | زر الاستبدال |
| skin_item_divider.9.png | /yalla-ui/full/ | فاصل بين العناصر |
| innavigation_left_check.webp | /yalla-ui/full/ | تبويب نشط (يسار) |
| innavigation_intermediate_uncheck.webp | /yalla-ui/full/ | تبويب غير نشط (وسط) |
| navigation_right_uncheck.webp | /yalla-ui/full/ | تبويب غير نشط (يمين) |
| dice_uncheck.webp | /yalla-ui/full/ | أيقونة قسم النرد |
| token_uncheck.webp | /yalla-ui/full/ | أيقونة قسم الرمز |
| bubble_uncheck.webp | /yalla-ui/full/ | أيقونة قسم الفقاعة |
| theme_uncheck.webp | /yalla-ui/full/ | أيقونة قسم المواضيع |
| reddot.webp | /yalla-ui/full/ | نقطة حمراء (تنبيه) |
| shelves.webp | /yalla-ui/full/ | رفوف المتجر |
| shop_item_bg.webp | /yalla-ui/shop/ | خلفية بطاقة عنصر |
| delete_account.webp | /yalla-ui/full/ | خلفية أزرار باهتة |
| line_gray.webp | /yalla-ui/full/ | فاصل متقطع |
| label_best.webp | /yalla-ui/full/ | شارة BEST |
| label_popular.webp | /yalla-ui/full/ | شارة POPULAR |
| bg_feed_back_detail.9.png | /yalla-ui/full/ | خلفية لوحة قابلة للتمرير |

**أصول لم يوجد لها أصل في السورس المستخرج**:
- أيقونات أقسام المتجر الرئيسي (شبكة A1) — مبني ديناميكياً من كود Java
- أضواء الزينة المعلّقة أعلى الشاشة — لم يوجد layout/asset صريح
- زر "%" (خصومات) — يحتاج لتدقيق في كود Java

---

## 5) نموذج البيانات المقترح (للدفعة 2)

```ts
interface StoreCategory {
  id: string;
  nameAr: string;
  icon: string;
  pageType: 'cards' | 'wallhangings' | 'themes' | 'dice' | 'uniqueid' | 'entryeffects' | 'vehicle' | 'stickers';
  order: number;
  visible: boolean;
  redDot: boolean;
  condition?: 'always' | 'royal3+' | 'vip' | 'activities';
}

interface StoreItem {
  id: string;
  categoryId: string;
  nameAr: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'diamonds' | 'gold';
  isFree: boolean;
  discountPercent?: number;
  isNew: boolean;
  sortOrder: number;
  visible: 'shown' | 'hidden' | 'scheduled';
  scheduleStart?: string;
  scheduleEnd?: string;
  source: 'ours' | 'imported';
  condition?: string;
  // ملكية
  obtainedFrom?: 'gift' | 'purchase' | 'level' | 'event' | 'admin' | 'achievement';
}
```

---

## 6) خطة الترحيل (للدفعة 2)

| الفئة | قبل | بعد الترحيل | المضاف (من السورس) | المتعارض | غير المصنّف |
|---|---|---|---|---|---|
| إطارات | ~123 | ~123 + 0 جديد | لا يوجد إطارات جديدة في السورس المستخرج (الموجود لدينا مأخوذ من السورس) | 0 | 0 |
| معلقات | 4 | 4 + أصول decor من السورس | أصول decor_bg_blue/orange/purple/red (4 خلفيات) | 0 | 0 |
| مواضيع | 10 | 10 + skin_13xxx من السورس | ~5 ملفات skin_13000-13004 (مواضيع) | 0 | 0 |
| بطاقات | 7 | 7 + 0 جديد | لا يوجد بطاقات جديدة في السورس المستخرج | 0 | 0 |
| نرد (جديد) | 0 | ~8 من السورس | skin_10000-10012 (نرد) | 0 | 0 |
| رمز (جديد) | 0 | ~6 من السورس | skin_11000-11006 (رمز) | 0 | 0 |
| فقاعات (جديد) | 0 | ~7 من السورس | skin_12000-12006 (فقاعات) | 0 | 0 |

**كل عنصر مضاف من السورس يُضاف بحالة "مخفي"** حتى يفعّله الأدمن.
**عناصرنا الحالية تحتفظ بحالة ظهورها كما هي.**

---

## 7) ملخص Batch 1

- ✅ تدقيق كامل للسورس (1607 layouts + 4252 drawables)
- ✅ جرد بياناتنا الحالية (~144 عنصر في 4 فئات)
- ✅ جرد صفحات الأدمن الحالية (4 أقسام: frames/ornaments/themes/cards)
- ✅ قرار كل صفحة: (ب) تُطوَّر وتُوسَّع (لا حذف)
- ✅ قائمة الأقسام الكاملة من السورس (10 أقسام)
- ✅ أصول السورس المستخدمة (21 أصل موثّق)
- ✅ أصول لم يوجد لها أصل (أيقونات شبكة A1 + أضواء زينة + زر %)
- ✅ نموذج بيانات مقترح مع Visibility
- ✅ خطة ترحيل (عناصر جديدة من السورس بـ "مخفي")

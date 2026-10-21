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

---

## 8) تقرير تكميلي (الدفعة 1 الموسعة)

### 8-1) A1 والسورس: أين يُبنى المتجر الرئيسي؟

**البحث في**: Java/Kotlin/DEX/JSON/assets.

**النتيجة**: لا يوجد DEX مُفكوك في مشروعنا. ملفات Java الموجودة (`android/app/src/main/java/com/bengharbios/`) هي كود Capacitor wrapper فقط (MainActivity, RoomPlugin, RoomActivity) — لا تحتوي على كود Yalla Ludo الأصلي.

لا توجد ملفات JSON تخص تكوين شبكة المتجر. `EffectConfig.json` يخص مؤثرات الغرف فقط، و`frames.json` يخص كتالوج الإطارات.

**القرار**: لا يمكنني العثور على بناء شبكة الأقسام/الرفوف/الأضواء/زر "%" في الكود المتاح. **أعتمد لقطات A1-A4 كمرجع بصري** وأوثّق ذلك.

---

### 8-2) جدول الأقسام مطابق لـ A1

| # | القسم (من A1) | موجود في السورس؟ | الصفحة/الكود | عدد عناصره | مبني بلا لقطة؟ |
|---|---|---|---|---|---|
| 1 | غلاف جاكارو | ✅ `dialog_skin_jackaroo.xml` | صفحة أغلفة الجاكارو | 0 لدينا / ~6 من السورس (skin_11000-11005) | لا — مشابه لـ A2 |
| 2 | غلاف دومينو | ✅ `dialog_skin_dice.xml` (dice=domino) | صفحة أغلفة الدومينو | 0 لدينا / ~13 من السورس (skin_10000-10012) | لا — مشابه لـ A2 |
| 3 | غلاف لودو | ✅ `fragment_skin.xml` tab 1 (Dice) | صفحة أغلفة اللودو | مدمج مع غلاف الدومينو (نرد مشترك) | لا |
| 4 | ملصقات | ❌ لا يوجد layout/asset | TBD | 0 | **نعم — بلا لقطة** |
| 5 | بطاقة الملف | ✅ `dialog_royall_file_card.xml` + لدينا (kind=card) | صفحة البطاقات | 7 لدينا / 0 جديد من السورس | لا — مشابه لـ A2 |
| 6 | المعلقات الجدارية | ✅ `dialog_decor_skin.xml` + لدينا (kind=ornament) | صفحة المعلقات | 4 لدينا / 0 جديد | لا — A3 |
| 7 | المعرّف الفريد | ✅ `item_unique_id.xml`, `item_uniqueid_rank.xml` | صفحة المعرّف الفريد | 0 لدينا / متغير من السورس | **نعم — بلا لقطة** |
| 8 | موضوع | ✅ `dialog_skin_theme.xml` + لدينا (kind=theme) | صفحة المواضيع | 10 لدينا / ~4 من السورس (skin_13000-13003) | لا — A4 |
| 9 | تثبيت في الأعلى | ✅ امتياز في `item_privileges.xml` | امتياز (ليس عنصر شراء) | N/A (امتياز) | نعم — بلا لقطة |
| 10 | مؤثرات الدخول | ✅ `fragment_skin.xml` tab 3 (Bubble) | صفحة مؤثرات الدخول | 0 لدينا / ~7 من السورس (skin_12000-12006) | **نعم — بلا لقطة** |
| 11 | مركبة رويال | ✅ `dialog_royall_store_car_gift.xml` | صفحة مركبات رويال | 0 لدينا / متغير من السورس | **نعم — بلا لقطة** |

**ملاحظة**: "غلاف لودو" و"غلاف دومينو" قد يكونان نفس القسم (كلاهما نرد/Dice). سأطابق حسب A1 حتى يؤكد المستخدم خلاف ذلك.

---

### 8-3) جدول التعارضات الفعلي (عناصرنا vs عناصر السورس)

**الإطارات (YALLA_FRAMES vs SVGA_FRAMES_CATALOG — نفس المعرّف، بيانات مختلفة)**:

| المعرّف | اسم YALLA_FRAMES | سعر YALLA | ندرة YALLA | اسم SVGA | سعر SVGA | ندرة SVGA | الحالة |
|---|---|---|---|---|---|---|---|
| 110001 | البطل في الترتيب العالمي | 500 | epic | البطل العالمي | 10000 | legendary | ⚠️ تعارض (نفس ID، أسعار مختلفة) |
| 110002 | الثاني في الترتيب العالمي | 500 | epic | الوصيف العالمي | 10000 | legendary | ⚠️ تعارض |
| 110003 | الثالث في الترتيب العالمي | 500 | epic | الثالث عالمياً | 10000 | legendary | ⚠️ تعارض |
| 110004 | أعلى 100 عالمياً | 500 | epic | أعلى 100 عالمياً | 10000 | epic | ⚠️ تعارض (السعر فقط) |
| 110005 | أعلى 500 عالمياً | 500 | epic | أعلى 500 عالمياً | 10000 | epic | ⚠️ تعارض (السعر فقط) |
| 110006 | أعلى 1000 عالمياً | 500 | epic | أعلى 1000 عالمياً | 10000 | epic | ⚠️ تعارض (السعر فقط) |
| 120009 | إطار أسبوعي و | 300 | rare | أسبوعي مميز | 10000 | rare | ⚠️ تعارض |
| 121003 | إطار أسبوعي ز | 300 | rare | لؤلؤة الشرق | 10000 | rare | ⚠️ تعارض (اسم مختلف أيضاً) |
| 121013 | هدية فريق الأكروبات | 250 | rare | فريق الأكروبات | 10000 | rare | ⚠️ تعارض |
| 121014 | هدية الجزيرة | 250 | rare | الجزيرة الذهبية | 10000 | rare | ⚠️ تعارض |
| 121015 | هدية تساقط الشهب | 250 | rare | تساقط الشهب | 10000 | rare | ⚠️ تعارض |
| 121016 | هدية القلعة | 250 | rare | القلعة المنيعة | 10000 | rare | ⚠️ تعارض |
| 121017 | VIP — الفارس | 600 | epic | VIP الفارس | 10000 | epic | ⚠️ تعارض |
| 121018 | VIP — اللواء | 600 | epic | VIP اللواء | 10000 | epic | ⚠️ تعارض |
| 121019 | نشاط عيد الفطر 2021 | 100 | common | عيد الفطر 2021 | 10000 | common | ⚠️ تعارض |
| 121020 | نشاط عيد الأضحى 2021 | 100 | common | عيد الأضحى 2021 | 10000 | common | ⚠️ تعارض |
| 121023 | حصري رويال 1 | 1000 | legendary | حصري رويال 1 | 10000 | legendary | ⚠️ تعارض (السعر فقط) |
| 121024 | حصري رويال 2 | 1000 | legendary | حصري رويال 2 | 10000 | legendary | ⚠️ تعارض |
| 121025 | حصري رويال 3 | 1000 | legendary | حصري رويال 3 | 10000 | legendary | ⚠️ تعارض |
| 121026 | حصري رويال 4 | 1000 | legendary | حصري رويال 4 | 10000 | legendary | ⚠️ تعارض |
| 121027 | حصري رويال 5 | 1000 | legendary | حصري رويال 5 | 10000 | legendary | ⚠️ تعارض |
| 121028 | مكافأة ربط YallaChat | 0 | common | هدية اللاعبين الجدد | 10000 | common | ⚠️ تعارض (اسم + سعر مختلف) |
| 121031 | هدية عجلة الملاهي | 250 | rare | عجلة الملاهي | 10000 | rare | ⚠️ تعارض |
| 121032 | نشاط أضئ البرج ب | 100 | common | أضئ البرج ب | 10000 | common | ⚠️ تعارض |
| 121033 | نشاط من هو الفائز | 100 | common | من هو الفائز | 10000 | common | ⚠️ تعارض |
| 121035 | محصول النشاط أ | 100 | common | محصول النشاط أ | 10000 | common | ⚠️ تعارض |
| 121036 | نشاط عيد الفطر 2023 | 100 | common | عيد الفطر 2023 | 10000 | common | ⚠️ تعارض |
| 121040 | (غير موجود في YALLA) | — | — | إكليل الزهور | 10000 | rare | ✅ SVGA فقط |
| 121041 | نشاط دعوة الأصدقاء | 100 | common | دعوة الأصدقاء | 10000 | common | ⚠️ تعارض |
| 121042 | رخصة الغرفة الممتازة | 0 | common | رخصة الغرفة الممتازة | 10000 | common | ⚠️ تعارض |
| 121044 | نشاط وقت القهوة | 100 | common | وقت القهوة | 10000 | common | ⚠️ تعارض |
| 121046 | محصول النشاط ب | 100 | common | محصول النشاط ب | 10000 | common | ⚠️ تعارض |
| frame_1 | (غير موجود في YALLA) | — | — | الكلاسيكي الذهبي | 10000 | epic | ✅ SVGA فقط |
| frame_2 | (غير موجود في YALLA) | — | — | الفضي الملكي | 10000 | epic | ✅ SVGA فقط |
| frame_3 | (غير موجود في YALLA) | — | — | البرونزي النبيل | 10000 | epic | ✅ SVGA فقط |

**مجموع التعارضات**: 30 تعارض (نفس ID بأسعار/أسماء/ندرة مختلفة بين YALLA_FRAMES و SVGA_FRAMES_CATALOG)

**القرار المقترح**: عند التعارض، **نُبقي عنصرنا (YALLA_FRAMES)** ولا نستبدله. الـ SVGA هو نسخة متحركة لنفس الإطار — تُضاف كـ `animatedUrl` على نفس العنصر، لا كعنصر منفصل.

---

### 8-4) الإطارات: هل 45 SVGA عناصر مستقلة أم نسخ متحركة؟

**الإجابة**: **42 منها نسخ متحركة** لإطارات PNG موجودة (نفس المعرّف)، و **3 عناصر SVGA مستقلة** (frame_1, frame_2, frame_3).

| النوع | العدد | التفسير |
|---|---|---|
| PNG + SVGA (نفس ID) | 42 | نسخة متحركة لنفس الإطار — تُضاف كـ `animatedUrl` على العنصر الموجود |
| PNG فقط | 34 | إطارات ساكنة بلا نسخة متحركة |
| SVGA فقط | 3 | عناصر مستقلة جديدة (frame_1/2/3 — الكلاسيكي الذهبي/الفضي الملكي/البرونزي النبيل) |

**العدد الحقيقي للعناصر الفريدة**: **79** (76 PNG + 3 SVGA-only)

---

### 8-5) قائمة كل الأسعار الفعلية

#### إطارات YALLA_FRAMES (59 عنصر):

| السعر | العدد | العناصر |
|---|---|---|
| 0 (مجاني) | 8 | 121037, 121038, 121028, 121029, 121042, 121043, 121045, silver_moon, golden_classic |
| 100 | 15 | 121019, 121020, 121021, 121022, 121032, 121033, 121035, 121036, 121041, 121044, 121046, 132309, 132311, 132312, 132323 |
| 250 | 5 | 121013, 121014, 121015, 121016, 121031 |
| 300 | 12 | 120001-120006, 120008, 120009, 121001, 121003, 121039 |
| 500 | 6 | 110001-110006 |
| 600 | 2 | 121017, 121018 |
| 1000 | 13 | 200001-200008, 121023-121027 |

#### إطارات SVGA_FRAMES_CATALOG (45 عنصر):

| السعر | العدد |
|---|---|
| 10000 | 45 (الكل) |

#### معلقات (4 عناصر):

| المعرّف | السعر |
|---|---|
| orn_banner | 250 |
| orn_lights | 500 |
| orn_sparkle | 800 |
| hanging_meteors | 800 |

#### مواضيع (10 عناصر):

| المعرّف | السعر |
|---|---|
| bg_profile_theme_default | 0 (مجاني) |
| mafia/tobol/tabot/prison/risk/risk2/familyfeud/baharharb/shifarat | 300 (الكل) |

#### بطاقات (7 عناصر):

| المعرّف | السعر |
|---|---|
| room_profile_member_bg | 400 |
| charge_reward_profile_card | 400 |
| card_astronaut | 500 |
| card_glow | 500 |
| card_emerald_royal | 600 |
| card_royal_deer | 800 |
| card_golden_love | 800 |

---

### 8-6) ملكية اللاعب والعنصر المطبّق

**التخزين في 3 جداول**:

| الجدول | الحقول | الوصف |
|---|---|---|
| **AppUser** | `frame` TEXT, `ornament` TEXT, `card` TEXT, `cover` TEXT | يخزّن **معرّف العنصر المطبّق حالياً** (لقراءة سريعة في البروفيل) |
| **UserFrame** | (userId, frameId, isEquipped, obtainedFrom, obtainedNote, obtainedAt) | سجل ملكية كل إطار للاعب + هل هو مطبّق |
| **UserDecor** | (userId, itemId, isEquipped, obtainedFrom, obtainedNote, obtainedAt) | سجل ملكية كل عنصر زينة + هل هو مطبّق |

**كيف يُقرأ في البروفيل**:
- `AppUser.frame` → يحدد الإطار المطبّق (يُعرض حول صورة اللاعب في SiteHeader)
- `AppUser.ornament` → يحدد المعلق الجداري المطبّق
- `AppUser.card` → يحدد بطاقة الملف المطبّقة
- `AppUser.cover` → يحدد موضوع/غلاف الملف المطبّق

**عنصر واحد مطبّق لكل فئة** (frame, ornament, card, cover) — تطبيق عنصر جديد يُلغي تطبيق القديم في نفس الفئة.

**API المقروءة في البروفيل**:
- `GET /api/auth/me` → يرجع `frame`, `ornament`, `card`, `cover` في بيانات المستخدم
- `GET /api/store/frames-catalog` → كتالوج الإطارات النشط
- `GET /api/store/decor-catalog?kind=ornament|theme|card` → كتالوج الزينة مع ملكية المستخدم

---

### 8-7) حجم السحب من السورس لكل قسم

| القسم | عناصر لدينا | عناصر ستُسحب من السورس | المصدر |
|---|---|---|---|
| إطارات | 79 فريد | 0 (موجودة لدينا بالكامل) | YALLA_FRAMES + SVGA_FRAMES_CATALOG |
| معلقات | 4 | 0 (لا أصول زينة جديدة في السورس المستخرج) | DECOR_SEED |
| مواضيع | 10 | ~4 (skin_13000-13003 — مواضيع Ludo) | skin_13xxx.webp |
| بطاقات | 7 | 0 (لا بطاقات جديدة) | DECOR_SEED |
| غلاف جاكارو | 0 | ~6 (skin_11000-11005) | skin_11xxx.webp |
| غلاف دومينو/لودو | 0 | ~13 (skin_10000-10012) | skin_10xxx.webp |
| مؤثرات دخول | 0 | ~7 (skin_12000-12006) | skin_12xxx.webp |
| معرّف فريد | 0 | متغير (item_unique_id — عدد غير محدد) | item_unique_id.xml |
| ملصقات | 0 | 0 (لا يوجد أصل) | — |
| مركبة رويال | 0 | متغير (dialog_royall_store_car_gift) | royal store layouts |

**إجمالي السحب المتوقع**: ~30 عنصر جديد (مخفي افتراضياً)

---

### 8-8) الأقسام المبنية بلا لقطة مرجعية

| القسم | له لقطة؟ | المرجع البديل |
|---|---|---|
| ملصقات | ❌ لا | لا يوجد أصل في السورس — قد يحتاج لقطة من المستخدم أو يُحذف |
| معرّف فريد | ❌ لا | `item_unique_id.xml` + `item_uniqueid_rank.xml` في السورس |
| مؤثرات دخول | ❌ لا | `fragment_skin.xml` tab 3 (Bubble) + `skin_12xxx.webp` |
| مركبة رويال | ❌ لا | `dialog_royall_store_car_gift.xml` + `dialog_royall_store_car_preview.xml` |
| تثبيت في الأعلى | ❌ لا | امتياز في `item_privileges.xml` — ليس عنصر شراء |
| غلاف جاكارو | ✅ مشابه لـ A2 | `dialog_skin_jackaroo.xml` |
| غلاف دومينو | ✅ مشابه لـ A2 | `dialog_skin_dice.xml` |

---

## 9) تقرير سورس يللا (الدفعة 1 الموسعة — التصحيح الكامل)

### 9-1) تحديد السورس

| البيان | القيمة |
|---|---|
| الرابط | https://github.com/bengharbios/G-G-2/releases/download/source-v3/YallaLudo.zip |
| حجم الأرشيف | 256 MB |
| بعد فك الضغط | 322 MB |
| عدد الملفات | 50 (base.apk + split APKs + data_files) |
| نوع السورس | **APK مفكوك** (base.apk + split APKs) — يحتاج apktool للتفكيك |
| بعد تفكيك base.apk | 1009 MB، 76151 ملف، 1711 layout، 68145 smali |
| المجلد | `/home/z/work/yalla_decompiled/` |

### 9-2) التصحيح: تقريري السابق كان خاطئاً

في تقريري السابق قلت: "لا يوجد layout في السورس المستخرج يُطابق صورة A1". **هذا كان خطأً** لأنني بحثت في مشروعنا (Capacitor wrapper) وليس في سورس يللا. بعد تفكيك base.apk بـ apktool، وجدت كل ما يلي:

### 9-3) نافذة المتجر الرئيسي (A1) — موجودة بالكامل

**fragment_rl_shop.xml** = صفحة المتجر الرئيسي:

| العنصر | المسار في سورس يللا | الوصف |
|---|---|---|
| الحاوية | `res/layout/fragment_rl_shop.xml` | RelativeLayout 360dip، bg=bg_hall |
| العنوان | TitleWithDiamondView (53dip) | شريط علوي بالماس والذهب |
| **أضواء الزينة** | `LudoSVGAView source="star_light.svga"` (full width × 50dip, marginTop=37) | ✅ **وُجدت!** أضواء معلقة بأعلى الشاشة |
| الخلفية | `rl_shop_bg_new.9.png` على RecyclerView | خلفية المتجر |
| البانر | `ShopBannerPager` (gone افتراضياً) | بانر دائري (gone) |
| شبكة الأقسام | `RecyclerView rcy_shop_list` (GridLayoutManager) | شبكة على رفوف |
| الأسهم | fl_arrow_left / fl_arrow_right (gone) | أسهم تنقل البانر |

### 9-4) عنصر القسم (rl_shop_item.xml) — موجود بالكامل

| العنصر | المسار | الأبعاد | الوصف |
|---|---|---|---|
| المنصة | `rl_shop_item_bg.webp` (view_bg) | 103×102dip | منصة دائرية يقف عليها الأيقونة |
| الأيقونة | iv_icon (120×90dip) | صورة القسم | يتمركز فوق المنصة |
| الاسم | tv_name (80×21dip, auto-size 8-11sp white) | لافتة باسم القسم | أسفل المنصة |
| النقطة الحمراء | iv_red_dot (10×10dip, reddot.webp) | تنبيه | تنبيه عند وجود تحديث |
| **نجمة SVGA** | svga_star (120×80dip, source="star_rl_shop.svga") | ✅ **وُجدت!** | حركة نجوم لامعة فوق القسم |

### 9-5) الرف (rl_shop_item_divider.xml) — موجود بالكامل

| العنصر | المسار | الأبعاد | الوصف |
|---|---|---|---|
| الرف | `rl_shop_item_divider.9.png` | full width × 89dip | رف بين صفوف الأقسام — 9-patch قابل للتمدد |

### 9-6) عنوان القسم (rl_shop_item_title.xml) — موجود

| العنصر | المسار | الوصف |
|---|---|---|
| العنوان | tv_title (249×27dip, 17sp #5ae7bc, bg=bg_skin_title) | عنوان اختياري فوق مجموعة أقسام |
| زر "؟" | iv_rules (17×18dip, question_icon.webp, gone) | زر مساعدة اختياري |

### 9-7) الأقسام الـ 10 المؤكدة من سورس يللا (smali)

من `RLShopFragment.smali` — مراجع الأيقونات المُحمّلة:

| # | القسم | أيقونة سورس يللا | مسار smali (سطر) | صفحته |
|---|---|---|---|---|
| 1 | غلاف لودو | rl_shop_skin.webp | L1834 | fragment_skin.xml (tab Dice) |
| 2 | غلاف دومينو | rl_shop_domino.webp | L1923 | fragment_skin.xml (tab Domino?) |
| 3 | غلاف جاكارو | rl_shop_jackaroo.webp | L2010 | dialog_skin_jackaroo.xml |
| 4 | بطاقة الملف | rl_shop_card.webp | L2193 | fragment_face_shop.xml |
| 5 | المعلقات الجدارية | **icon_decor_shop**.webp | L2280 | dialog_decor_skin.xml |
| 6 | المعرّف الفريد | rl_shop_id.webp | L2366 | fragment_uniqueid_shop.xml |
| 7 | موضوع | rl_shop_theme.webp | L2489 | dialog_skin_theme.xml |
| 8 | تثبيت في الأعلى | rl_shop_pin_on_top.webp | L2546 | (امتياز) |
| 9 | مركبة رويال | rl_shop_car.webp | L2620 | dialog_royall_store_car_gift.xml |
| 10 | مؤثرات الدخول | rl_shop_enter_effect.webp | L2740 | (fragment_skin tab Bubble?) |

**النقطة الحمراء**: `isShowDecorRedDot()` في السطر 2267 — تظهر على قسم المعلقات الجدارية عند وجود زينة جديدة.

**ملاحظة**: "ملصقات" (Stickers) غير موجودة في smali كقسم مستقل. لكن `title_face_shop_sticker.webp` موجود كعنوان لصفحة fragment_face_shop. قد يكون "ملصقات" هو اسم آخر لـ "بطاقة الملف" أو قسم يُضاف من server config. **أنتظر قرار المستخدم**.

### 9-8) زر "%" (الخصومات)

لم أجد مرجعاً مباشراً لزر "%" في fragment_rl_shop.xml. قد يكون:
- في `ShopFragment.smali` (الذي يحتوي على GridLayoutManager أيضاً)
- أو يُضاف ديناميكياً من server config

### 9-9) التصحيحات مقارنة بتقريري السابق

| البيان | تقرير سابق | تصحيح سورس يللا |
|---|---|---|
| "لا يوجد layout للمتجر الرئيسي" | ❌ خطأ | ✅ `fragment_rl_shop.xml` موجود بالكامل |
| "أضواء الزينة غير موجودة" | ❌ خطأ | ✅ `star_light.svga` موجود في fragment_rl_shop.xml |
| "زر % غير موجود" | ⚠️ لم يُبحث جيداً | يحتاج بحث أعمق في ShopFragment.smali |
| عدد الأقسام: 10-11 | 10 في smali | 10 مؤكدة (ملصقات غير موجودة في smali) |
| 30 تعارض SVGA/PNG | ✅ صحيح | لا تغيير |
| 79 إطار فريد | ✅ صحيح | لا تغيير |

### 9-10) أصول سورس يللا الجديدة المكتشفة

| الأصل | المسار | الاستخدام |
|---|---|---|
| fragment_rl_shop.xml | res/layout/ | صفحة المتجر الرئيسي |
| rl_shop_item.xml | res/layout/ | عنصر قسم على شبكة |
| rl_shop_item_large.xml | res/layout/ | عنصر قسم كبير |
| rl_shop_item_title.xml | res/layout/ | عنوان مجموعة أقسام |
| rl_shop_item_divider.xml | res/layout/ | الرف بين الصفوف |
| rl_shop_bg_new.9.png | res/drawable-xxhdpi/ | خلفية المتجر |
| rl_shop_item_bg.webp | res/drawable-xxhdpi/ | منصة القسم |
| rl_shop_item_divider.9.png | res/drawable-xxhdpi/ | صورة الرف |
| rl_shop_item_name_bg.webp | res/drawable-xxhdpi/ | خلفية اسم القسم |
| rl_shop_skin.webp | res/drawable-xxhdpi/ | أيقونة غلاف لودو |
| rl_shop_domino.webp | res/drawable-xxhdpi/ | أيقونة غلاف دومينو |
| rl_shop_jackaroo.webp | res/drawable-xxhdpi/ | أيقونة غلاف جاكارو |
| rl_shop_card.webp | res/drawable-xxhdpi/ | أيقونة بطاقة الملف |
| rl_shop_id.webp | res/drawable-xxhdpi/ | أيقونة معرّف فريد |
| rl_shop_theme.webp | res/drawable-xxhdpi/ | أيقونة موضوع |
| rl_shop_pin_on_top.webp | res/drawable-xxhdpi/ | أيقونة تثبيت في الأعلى |
| rl_shop_car.webp | res/drawable-xxhdpi/ | أيقونة مركبة رويال |
| rl_shop_enter_effect.webp | res/drawable-xxhdpi/ | أيقونة مؤثرات دخول |
| icon_decor_shop.webp | res/drawable-xxhdpi/ | أيقونة معلقات جدارية |
| star_light.svga | assets/ | أضواء الزينة المعلقة |
| star_rl_shop.svga | assets/ | نجوم لامعة على كل قسم |
| bg_skin_title.webp | res/drawable-xxhdpi/ | خلفية عنوان مجموعة |
| skin_arrow_left.webp | res/drawable-xxhdpi/ | سهم تنقل يسار |
| skin_arrow_right.webp | res/drawable-xxhdpi/ | سهم تنقل يمين |
| bg_shop_top_banner.webp | res/drawable-xxhdpi/ | خلفية البانر العلوي |

### 9-11) العدد الفعلي لعناصر كل قسم من سورس يللا

| القسم | عدد العناصر لدينا | عدد العناصر في سورس يللا | المصدر |
|---|---|---|---|
| غلاف لودو (skin) | 0 | ~13 (skin_10000-10012) | res/drawable-xxhdpi/skin_10xxx.webp |
| غلاف دومينو | 0 | مدمج مع لودو؟ أو مستقل | يحتاج تحقق من smali |
| غلاف جاكارو | 0 | ~6 (skin_11000-11005) | res/drawable-xxhdpi/skin_11xxx.webp |
| بطاقة الملف | 7 | متغير | fragment_face_shop.xml |
| المعلقات الجدارية | 4 | متغير | dialog_decor_skin.xml |
| المعرّف الفريد | 0 | متغير (server-driven) | fragment_uniqueid_shop.xml |
| موضوع | 10 | ~4 (skin_13000-13003) | res/drawable-xxhdpi/skin_13xxx.webp |
| تثبيت في الأعلى | N/A (امتياز) | N/A | امتياز وليس عنصر شراء |
| مركبة رويال | 0 | متغير | dialog_royall_store_car_gift.xml |
| مؤثرات الدخول | 0 | ~7 (skin_12000-12006) | res/drawable-xxhdpi/skin_12xxx.webp |

**إجمالي السحب المتوقع**: ~30 عنصر جديد (مخفي افتراضياً)

### 9-12) الملكية — كيف تُخزَّن وتُقرأ

| الجدول | الحقول | الوصف |
|---|---|---|
| AppUser | frame, ornament, card, cover | المعرّف المطبّق حالياً (قراءة سريعة في البروفيل) |
| UserFrame | userId, frameId, isEquipped, obtainedFrom, obtainedNote, obtainedAt | ملكية الإطارات |
| UserDecor | userId, itemId, isEquipped, obtainedFrom, obtainedNote, obtainedAt | ملكية الزينة (معلقات/مواضيع/بطاقات) |

البروفيل يقرأ: `AppUser.frame` (إطار) + `AppUser.ornament` (معلق) + `AppUser.card` (بطاقة) + `AppUser.cover` (موضوع).

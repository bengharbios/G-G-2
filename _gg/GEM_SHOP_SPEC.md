# GEM_SHOP_SPEC.md — Yalla Ludo نافذة شحن الماس (Diamond Shop)

> **المرجع الوحيد للحقيقة**: السورس الأصلي (layout XML + أصول الصور) + مواصفات المستخدم (image 2).
> عند وجود تعارض بين صورة المستخدم والسورس: **الأولوية للسورس**، ويُسجّل التعارض في جدول التعارضات بالأسفل.

---

## 0) تقنية المشروع وملفات النافذة

- **Tech**: Next.js 16 + React 19 + TypeScript + Tailwind
- **APK Source**: Yalla Ludo v1.5.1.0 (com.yalla.yallagames)
- **Layouts (المصدر XML)**:
  - `docs/yalla-layouts/fragment_shop.xml` — الحاوية الرئيسية للنافذة (3 ألسنة + رصيد + زر إغلاق)
  - `docs/yalla-layouts/view_shop_diamonds.xml` — محتوى لسان الماس (divider + RecyclerView + زر تفاصيل)
  - `docs/yalla-layouts/item_diamonds.xml` — بطاقة حزمة الماس (107×150dip)
  - `docs/yalla-layouts/item_shop_guild.xml` — ويدجت مكافأة أول شحن (chest + speech bubble + 3×2 grid)
  - `docs/yalla-layouts/dialog_shop_fast_pay.xml` — نسخة بديلة من المكافأة (عرض أفقي 1×6 — غير مستخدمة في النسخة الحديثة)
- **Component الحالي**: `src/components/shared/ChargeDialog.tsx`
- **API**: `src/app/api/gems/packages/route.ts` (GET) + `src/app/api/gems/charge/route.ts` (POST)

---

## 1) جدول العناصر الكامل (كل عنصر = سطر)

| # | العنصر | المسار في السورس | الموقع (px على 360×800) | الأبعاد (dip) | الألوان (HEX مأخوذة من أصول السورس) | الخط/الحجم/اللون/الحد | الحالات (عادي/ضغط/معطّل) | الحركة (نوعها/مدتها/تكرارها/Easing) | الملاحظات |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **الحاوية rl_container** | `fragment_shop.xml` L2 | (0,0) → (360,800) | 360 × fill_parent | bg=skin_bg.9.png (#197458 dark green avg) | — | — | — | شاشة كاملة، بدون إطار خارجي. خلفية متدرجة من السورس |
| 2 | **خلفية متدرجة (Vignette)** | تكوين CSS من skin_bg | الأطراف | inset 0 | gradient radial: center #2D886C → edges #197458 + radial-gradient rgba(0,0,0,.25) على الأطراف | — | — | — | يُحاكى تعتيم الأطراف من صورة المستخدم |
| 3 | **زر الإغلاق X** (top-left) | `fragment_shop.xml` L39 `iv_close` (الأصل: يمين) | (15,15) | 48×48 | src=skin_close.webp (#1f6d4c → white glyph) | — | عادي: opacity 1; ضغط: opacity 0.7 + scale 0.95; معطّل: N/A | — | ⚠️ تعارض: الأصل يمين، صورة المستخدم يسار. القرار: اتباع صورة المستخدم (يسار) لتطابق image 2 |
| 4 | **رصيد الماس (rl_diamonds)** | `fragment_shop.xml` L11-14 | (top 8, center-left) | bg_add_coin (75×20dip) + diamonds.webp (29×29dip) | bg=bg_add_coin.xml → solid #0c3c30 + radius 10dip; النص أبيض 11sp | 11sp bold white, stroke #94f534 width 2dip (StrokeTextStyle) | عادي: opacity 1; ضغط على chip: scale 0.97 | — | الكبسولة لها أيقونة الماس 29×29 على اليسار والرقم بداخلها على اليمين، الأيقونة تتجاوز الحافة اليسرى قليلاً |
| 5 | **رصيد الذهب (rl_gold)** | `fragment_shop.xml` L7-10 | (top 8, center-right of diamonds) | bg_add_coin (75×20dip) + coin.webp (29×29dip) | bg=#0c3c30 + radius 10; نص أبيض 11sp | 11sp bold white | عادي/ضغط مثل diamond chip | — | يأتي بعد رصيد الماس مباشرة |
| 6 | **صورة اللاعب الدائرية** (top-right) | تكوين من رأس الـAppUser | (top 10, right 10) | 48×48 | circular avatar + green frame 2-3px | — | — | — | غير موجود في fragment_shop.xml الأصلي؛ مُضاف لتطابق image 2 |
| 7 | **شارة R0/R1/.../R5 أسفل الصورة** | `royal_level_0.webp` ~ `royal_level_5.webp` | أسفل الصورة بـ 4px | 24×24 | src=royal_level_N.webp (gold #f2b734 badge) | — | — | — | المستوى يُجلب من /api/royal/state |
| 8 | **الألسنة radio_group_switch** | `fragment_shop.xml` L16-35 | (top 60, centerHorizontal, 8px margins) | 344×45dip | — | — | — | — | 3 FrameLayouts بـ weight=1 |
| 8a | **لسان الذهب fl_switch_gold** | L17-22 | داخل الـradio_group | fill_parent (weight=1) × 45dip | bg=shop_switch_left_check.webp (avg #20d8a4 active teal-green) | 12sp bold white; marginTop=2 | نشط: bg=left_check, text=white; غير نشط: bg=middle_uncheck, text=#17654c dark green | لا يوجد انتقال صريح في السورس، يُحاكى بـ fade 200ms | — |
| 8a-icon | **iv_switch_gold** | L19 | داخل fl_switch_gold | 16×17dip | src=shop_switch_gold_check.webp (63×68) عند التفعيل / shop_switch_gold_uncheck.webp عند عدم التفعيل | — | — | — | — |
| 8b | **لسان الماس fl_switch_diamond** | L23-28 | داخل الـradio_group | fill_parent (weight=1) × 45dip | bg=shop_switch_middle_uncheck.webp (avg #27b387 teal-green) | 12sp bold; نشط #17654c, غير نشط #17654c | نشط: bg=middle_check (مُخمن من symmetry), text=white; غير نشط: bg=middle_uncheck | — | — |
| 8b-icon | **iv_switch_diamond** | L25 | داخل fl_switch_diamond | 16×19dip | src=shop_switch_diamond_check.webp (63×76) / shop_switch_diamond_uncheck.webp | — | — | — | — |
| 8c | **لسان الاشتراكات fl_switch_privilege** | L29-34 | داخل الـradio_group | fill_parent (weight=1) × 45dip | bg=shop_switch_right_uncheck.webp (avg #26af84) | 12sp bold #17654c | نشط: bg=right_check (مُخمن), text=white; غير نشط: bg=right_uncheck | — | — |
| 8c-icon | **iv_switch_privileges** | L31 | داخل fl_switch_privilege | 18.5×16dip | src=shop_switch_privilege_check.webp (73×62) / shop_switch_privilege_uncheck.webp | — | — | — | — |
| 9 | **شريط الفاصل (view_line / shop_top_green_line)** | `view_shop_diamonds.xml` L4 | (top ~133, full width) | fill_parent × 9dip | bg=shop_top_green_line.9.png (avg #1e8b69 medium green) | — | — | — | يفصل بين الألسنة والمحتوى |
| 10 | **عنوان مكافأة أول شحن (tv_title)** | `item_shop_guild.xml` L25 | (top ~157, centerHorizontal) | wrap_content | النص: "مكافأة عند المرة الأولى من الشراء" | 17sp bold #fffff771 (gold-yellow), shadowColor=#80000000 shadowDy=6 radius=1 | — | — | النص هو @string/G_1420_129 من السورس |
| 11 | **خلفية الرف (iv_shelves)** | `item_shop_guild.xml` L26 | (top ~177, centerHorizontal) | 316×84dip | src=shelves.webp (avg #3eceaa bright teal-green, 3D beveled shelf) | — | — | — | — الرف له حافة فاتحة علوية + جسم + ظل سفلي — هذا هو "نظام الأرفف" |
| 12 | **تأثير Twinkle SVGA (iv_twinkle)** | `item_shop_guild.xml` L27 | (top ~157, same area as shelves) | 316×84dip | — | — | — | source="twinkle_point", view_scale=1.2, play_on_attach=true, حلقة لانهائية | ⚠️ ملف SVGA غير متوفر في /assets/ — استخدم تأثير CSS twinkle shimmer بديلاً (مُوثّق) |
| 13 | **صندوق الكنز الوردي (iv_charge_box)** | `item_shop_guild.xml` L30 | (top ~193, left of bubble, alignBottom=shelves) | 72×54dip | src=chest_firstcharge.webp (158×131, avg #a990a6 grayish-magenta — يبدو ورديًا/ماجنتا) | — | — | — | صندوق كنز وردي/ماجنتا بحواف فضية (مطابق لمواصفات المستخدم) |
| 14 | **فقاعة الكلام البيضاء (bg_firstcharge)** | `item_shop_guild.xml` L31 | (top ~185, right of chest) | 150×85dip | bg=bg_firstcharge.png (296×162, avg #cffee3 very light green-white, rounded bubble) | — | — | — | فقاعة بيضاء مدورة بـ 3×2 grid داخلها (مطابق لمواصفات المستخدم) |
| 15 | **Grid item 1: iv_gift (وردة/هدية)** | L33-36 | (col 1, row 1) داخل الـbubble | 36×36dip | src=recharge_room_gift.webp (114×114, avg #f57db4 bright pink — هذا "وردة/هدية" فعلاً!) | نص "+1" 9sp #467155 (dark green) | — | — | — |
| 16 | **Grid item 2: iv_profile_card (إطار/راية)** | L37-40 | (col 2, row 1) | 26×26dip | src=charge_reward_profile_card.webp (240×188, avg #97b8d0 light blue) | نص "+1" 9sp #467155 | — | — | — |
| 17 | **Grid item 3: iv_head_decor (خاتم/إكليل)** | L41-44 | (col 3, row 1) | 26×26dip | src=charge_reward_head_decor.webp (120×120, avg #b8944f gold-bronze) | نص "+1" 9sp #467155 | — | — | — |
| 18 | **Grid item 4: iv_head_frame (إطار رأس ذهبي)** | L47-50 | (col 1, row 2) | 23×24dip | src=charge_reward_head_frame.webp (120×120, avg #be8334 gold) | نص "+1" 9sp #467155 | — | — | — |
| 19 | **Grid item 5: iv_diamonds (ماسة زرقاء)** | L51-54 | (col 2, row 2) | 20×20dip | src=diamonds.webp (84×104, avg #4ac4e9 blue) | نص "+150" 9sp #467155 | — | — | — |
| 20 | **Grid item 6: iv_coin (عملة ذهبية)** | L55-58 | (col 3, row 2) | 20×20dip | src=coin.webp (87×92, avg #d3b145 gold) | نص "+15000" 9sp #467155 | — | — | — |
| 21 | **نص التنبيه تحت الرف (tv_reward_tip)** | `item_shop_guild.xml` L28 | (top ~278, centerHorizontal) | wrap_content | النص: "يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية" (@string/reward_tip) | 10sp bold white (#ffffffff), marginTop=-2 | — | — | — |
| 22 | **الرف 2 (shelves ظاهر ضمنيًا)** | — | (top ~445, full width) | 316×84dip | src=shelves.webp (مُعاد التركيب عبر CSS background-image تكررًا) | — | — | — | الرف 2 يظهر تلقائياً كجزء من الـ RecyclerView padding-bottom أو كخلفية لكل صف. الأصل يضع الرف كـ bg للـRecyclerView |
| 23 | **بطاقة الماس 1 — 400 / 0.99** | `item_diamonds.xml` (Right cell of Row 1, RTL) | (col 3, row 1) | 107×150dip | bg=shop_item_bg.webp (avg #5acce0 light blue-cyan) | — | — | — | رقم البطاقة (400)، السعر (USD 0.99)، شارة HOT |
| 23a | **خلفية البطاقة shop_item_bg** | L6 | البطاقة كاملة | 107×150dip | src=shop_item_bg.webp (367×515, avg #5acce0 light cyan-blue, fitXY, centerInParent) | — | — | — | إطار فاتح (3px) بحواف مدورة 10px (من الصورة) + حشوة متدرجة cyan + توهج دائري ناعم خلف الأيقونة |
| 23b | **كبسولة الرقم (ll1)** | L7-12 | أعلى البطاقة، marginTop=8, centerHorizontal | 79×20dip | أفقية: أيقونة ماس صغيرة (14×16dip) + رقم | الرقم 12sp bold #fff782 (light yellow) shadow #000 dy=3 radius=5 | — | — | تُقرأ القيمة من pkg.amount (400, 1800, 5000, ...) |
| 23c | **أيقونة الماس الكبيرة (iv_coin)** | L14 | وسط البطاقة | 88×88dip | diamonds1.webp (للحزمة 400) / diamonds2 (1800) / diamonds3 (5000) / diamonds4 (16.0K) / diamonds5 (53.7K) / diamonds6 (161.7K) | — | — | — | كل حزمة لها أيقونة مختلفة من السورس! (مطابق لمواصفات المستخدم) |
| 23d | **شارة HOT (svg_hot)** | L28 | أعلى يمين البطاقة (layout_gravity=end) | 35×35dip | SVGA animation | — | — | play_on_attach=true, loop=true (مُخمن) | ⚠️ شارة HOT غير موجودة كصورة ساكنة. الحل: استخدم **label_best.webp كصورة شارة HOT بديلة** + flame icon (room_icon_member_small_flame.webp) فوقها، أو أضف CSS pulse animation بديلة |
| 23e | **شارة BEST (svg_best)** | L17-20 | أعلى يمين البطاقة (layout_gravity=end, marginEnd=-3) | 60×21dip | FrameLayout: iv_best (SVGA) + "BEST" نص (10sp white) | BEST نص 10sp white center | — | play_on_attach=true (مُخمن shimmer) | استخدم label_best.webp (avg #de374d red ribbon) كصورة حقيقية |
| 23f | **شارة POPULAR** | — | — | 60×21dip | — | — | — | — | استخدم label_popular.webp (avg #e96adf pink-magenta ribbon) |
| 23g | **زر الشراء (ll_buy)** | L22-24 | أسفل البطاقة (alignParentBottom, marginBottom=8, centerHorizontal) | 90×32dip | bg=btn_shop.9.png (avg #6ecd0a bright green gradient with 3D bevel) | نص السعر "USD 0.99" 14sp bold #47790c (dark green) with stroke_color=#94f534 stroke_width=2dip | عادي: bg=btn_shop; ضغط: scale 0.95 + bg=btn_shop_press (not in assets → استخدم CSS filter: brightness 0.85); معطّل: opacity 0.5 | play_on_attach=true (مُخمن press animation) | — |
| 23h | **نص تلميح (tv_tips)** | L26 | فوق زر الشراء (marginBottom=45) | wrap_content | — | 9sp #3c93ad (teal) center, stroke_color=white stroke_width=1dip | — | — | النص: @string/G_1380_063 ("..." مُختصر) |
| 24 | **بطاقة الماس 2 — 1800 / 3.99** | نفس 23 | (col 2, row 1) | 107×150dip | diamonds2.webp | — | — | — | بدون شارة |
| 25 | **بطاقة الماس 3 — 5000 / 9.99** | نفس 23 | (col 1, row 1) | 107×150dip | diamonds3.webp | — | — | — | بدون شارة |
| 26 | **بطاقة الماس 4 — 16.0K / 29.99** | نفس 23 | (col 3, row 2) | 107×150dip | diamonds4.webp | — | — | — | شارة Popular |
| 27 | **بطاقة الماس 5 — 53.7K / 99.99** | نفس 23 | (col 2, row 2) | 107×150dip | diamonds5.webp | — | — | — | بدون شارة |
| 28 | **بطاقة الماس 6 — 161.7K / 299.99** | نفس 23 | (col 1, row 2) | 107×150dip | diamonds6.webp | — | — | — | شارة BEST |
| 29 | **الرف 3** | — | (top ~620) | 316×84dip | shelves.webp | — | — | — | — |
| 30 | **زر تفاصيل الماس (ctv_detail)** | `view_shop_diamonds.xml` L7 | (top ~768, centerHorizontal, marginBottom=8) | 191×25dip | bg=shop_item_tail_bg.9.png (avg #16644c dark green, rounded capsule with thin border) | النص: "تفاصيل الماس >>" 13sp #2bc895 (medium teal-green) bold center | عادي: bg=shop_item_tail_bg; ضغط: scale 0.97 | — | ⚠️ ملاحظة المستخدم: استخدم "الماس" وليس "الجواهر" |
| 31 | **مقبض/مؤشر أبيض رأسي (يمين الشاشة)** | مذكور في مواصفات المستخدم | (right edge, vertical center) | ~4×40dip | أبيض شفاف 50% | — | — | — | غير موجود في fragment_shop.xml — قد يكون عنصر نظام (Sidebar drawer handle) أو من نسخة أحدث. القرار: محاكاته بـ CSS (white 4×40 rounded) |
| 32 | **زر شحن إضافي في نموذج الشراء** | — | (overlay, center) | full × 40dip | bg=btn_shop.9.png | "USD 9.99 — شحن" 14sp bold #47790c stroke #94f534 | عادي/ضغط مثل 23g | — | — |

---

## 2) خريطة التخطيط المرجعية (على شاشة 360×800، بالنسب المئوية)

```
y=0      ┌──────────────────────────────────────────────────┐ 0%
         │  [X] [💎0]  [🪙5000]          [👤]              │   ← top bar (38-70 = 4.75%–8.75%)
y=70     │  ───────────────────────────────────────────────│ 8.75%
         │   [👑اشتراكات] [💎 الماس] [🪙 ذهب]              │   ← tabs (80-122 = 10%–15.25%)
y=122    │  ════════════════════════════════════════════════│ 15.25%
y=134    │  ─── shop_top_green_line ─────────────────────────│ 16.75%
y=157    │        مكافأة عند المرة الأولى من الشراء          │ 19.6% (tv_title)
y=175    │  ╔══════════════════════════════════════════════╗│ 21.9%
         │  ║ [chest]   ┌─bg_firstcharge bubble──┐         ║│
         │  ║ [box]     │ [🌹+1] [📺+1] [💍+1]    │         ║│
         │  ║           │ [👑+1] [💎+150] [🪙+15000]│         ║│
         │  ║           └──────────────────────────┘         ║│
y=255    │  ╚═════════ [shelves background] ═══════════════╝│ 31.9% (shelf 1)
y=282    │  يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية   │ 35.25% (tv_reward_tip)
         │                                                  │
y=295    │  ┌────────┐ ┌────────┐ ┌────────┐                  │ 36.9%
         │  │  400   │ │  1800  │ │  5000  │                  │ ← cards row 1
         │  │ [HOT]  │ │        │ │        │                  │
         │  │ 💎    │ │ 💎💎  │ │ 💎💎💎 │                  │
         │  │USD0.99│ │USD3.99│ │USD9.99│                  │
y=440    │  └────────┘ └────────┘ └────────┘                  │ 55%
y=445    │  ════════════════════════════════════════════════│ 55.6% (shelf 2)
y=475    │  ┌────────┐ ┌────────┐ ┌────────┐                  │ 59.4%
         │  │ 16.0K  │ │ 53.7K  │ │161.7K  │                  │ ← cards row 2
         │  │[POP]  │ │        │ │ [BEST] │                  │
         │  │ 💎💎  │ │ 💎💎  │ │ 💎💎💎 │                  │
         │  │USD29.99│ │USD99.99│ │USD299.99│                │
y=608    │  └────────┘ └────────┘ └────────┘                  │ 76%
y=620    │  ════════════════════════════════════════════════│ 77.5% (shelf 3)
         │                                                  │
y=768    │         [ تفاصيل الماس >> ]                       │ 96% (bottom button)
y=790    └──────────────────────────────────────────────────┘ 98.75%
```

### النسب المئوية (للتجاوب):
- top bar: top 4.75% to 8.75%
- tabs: top 10% to 15.25%
- divider: top 16.75%
- title: top 19.6%
- reward area: top 21.9% to 31.9%
- shelf 1: top 31.9% to 33.75%
- alert text: top 35.25%
- cards row 1: top 36.9% to 55%
- shelf 2: top 55.6% to 57.5%
- cards row 2: top 59.4% to 76%
- shelf 3: top 77.5% to 79.5%
- bottom button: top 96% to 98.75%, width 52.8% (191/360), center

### أبعاد البطاقة:
- card: 107×150dip → على 360 wide = 29.7% × 18.75% (3 cards + 12dip gap × 2 = 345 + 24 = 369 ≈ 360)
- ll1: 79×20dip at top, marginTop=8
- iv_coin: 88×88dip centered
- ll_buy: 90×32dip at bottom, marginBottom=8

---

## 3) الفروقات المُصحَّحة (التصميم السابق → الجديد)

| العنصر | السابق (خطأ) | الجديد (مطابق للسورس) |
|---|---|---|
| الخلفية | dialog ضغير بإطار داكن #0F3D33 | full-screen بـ skin_bg.9.png (#197458) + vignette |
| الشريط العلوي | أيقونة تاج + أزرار + صفراء + أرقام وهمية (32895/17000) | فقط X (يسار) + رصيد الماس (0 من API) + رصيد الذهب (5000 من API) + صورة لاعب |
| التبويبات | فارغة بلا أيقونات | 3 تبويبات بـ shop_switch_*_check/uncheck.webp (16-19dip) + نصوص 12sp |
| نظام الأرفف | بطاقات عائمة | shelves.webp خلفية للرفوف (3 رفوف) |
| مكافأة أول شحن | صف واحد من 6 أيقونات + رقم مشوّه + علامة نجمة | chest_firstcharge.webp (يسار) + bg_firstcharge.png (فقاعة بيضاء) بداخلها 3×2 grid من الأصول الأصلية |
| شارة أول شحن | صفراء "+23%" | غير موجودة في الأصل — لا توجد شارات خصم في الأصل |
| أرقام الباقات | 5.4K, 1.9K, 183.7K... (كلها خاطئة) | 400, 1800, 5000, 16.0K, 53.7K, 161.7K (مطابقة للجدول) |
| أيقونات الباقات | نفس diamonds1.webp لكل الباقات | diamonds1-6.webp مختلف لكل باقة (مطابق للأصل) |
| صيغة السعر | "$9.99" | "USD 9.99" (مطابق للأصل) |
| شارات البطاقات | أعلى يمين | أعلى يمين (مطابق للأصل layout_gravity=end) — ⚠️ مواصفات المستخدم طلبت أعلى يسار، تعارض سُجّل |
| زر الشراء | كبسولة أخضر ليموني | مستطيل مدور بـ btn_shop.9.png (avg #6ecd0a bright green + 3D bevel) |
| الزر السفلي | بيضاوي متوهج | كبسولة داكنة بـ shop_item_tail_bg.9.png (avg #16644c) + "تفاصيل الماس >>" 13sp #2bc895 |

---

## 4) الألوان المقاسة من أصول السورس (Python/PIL)

| الأصل | HEX | ملاحظات |
|---|---|---|
| skin_bg.9.png | #197458 | خلفية الحاوية (dark green) |
| shop_top_green_line.9.png | #1e8b69 | خط الفاصل (medium green) |
| shop_switch_left_check.webp | #20d8a4 | لسان ذهب نشط (bright teal-green) |
| shop_switch_middle_uncheck.webp | #27b387 | لسان ماس غير نشط (teal-green) |
| shop_switch_right_uncheck.webp | #26af84 | لسان اشتراكات غير نشط |
| shop_item_bg.webp | #5acce0 | خلفية بطاقة الماس (light cyan-blue) |
| btn_shop.png | #6ecd0a | زر الشراء (bright green) |
| btn_shop_free.png | #f8cb1c | زر مجاني (yellow) |
| label_best.webp | #de374d | شارة BEST (red ribbon) |
| label_popular.webp | #e96adf | شارة POPULAR (pink-magenta ribbon) |
| chest_firstcharge.webp | #a990a6 | صندوق الكنز (grayish-magenta) |
| bg_firstcharge.png | #cffee3 | الفقاعة البيضاء (very light green-white) |
| shelves.webp | #3eceaa | خلفية الرفوف (bright teal-green) |
| shop_item_tail_bg.9.png | #16644c | زر تفاصيل الماس (dark green) |
| diamonds.webp | #4ac4e9 | أيقونة الماس الصغيرة (blue) |
| coin.webp | #d3b145 | أيقونة العملة الصغيرة (gold) |
| recharge_room_gift.webp | #f57db4 | أيقونة الهدية/الوردة (bright pink) |
| charge_reward_profile_card.webp | #97b8d0 | أيقونة الإطار/الراية (light blue) |
| charge_reward_head_decor.webp | #b8944f | أيقونة الزينة/الخاتم (gold-bronze) |
| charge_reward_head_frame.webp | #be8334 | أيقونة الإكليل (gold) |
| skin_close.webp | #1f6d4c (computed) | زر الإغلاق X |
| bg_add_coin.xml shape | #0c3c30 (parsed from XML) | خلفية كبسولة الرصيد |
| diamonds1-6.webp | #4ac4e9 (avg) | الأيقونات الكبيرة للبطاقات |

---

## 5) الحركات الموجودة في السورس (Animations)

| العنصر | النوع | المصدر | المدة | التكرار | Easing | ملاحظات |
|---|---|---|---|---|---|---|
| iv_twinkle (تحت العنوان) | SVGA | `item_shop_guild.xml` L27, source="twinkle_point", view_scale=1.2 | غير محدد في XML | loop=true (play_on_attach=true) | غير محدد | ⚠️ ملف twinkle_point.svga غير موجود في /assets/ — بديل CSS: twinkle shimmer @keyframes 2s ease-in-out infinite |
| svg_hot (شارة HOT) | SVGA | `item_diamonds.xml` L28, play_on_attach=true | غير محدد | loop=true (مُخمن) | غير محدد | ⚠️ ملف svg_hot SVGA غير موجود — بديل: CSS pulse + flame icon |
| svg_best (شارة BEST) | SVGA | `item_diamonds.xml` L17-20 (iv_best SVGA inside FrameLayout) | غير محدد | loop=true (مُخمن) | غير محدد | ⚠️ بديل: استخدم label_best.webp كصورة ساكنة (شريط أحمر راية) |
| svg_stars (داخل البطاقة) | SVGA | `item_diamonds.xml` L15, play_on_attach=true | غير محدد | loop=true | غير محدد | ⚠️ بديل: CSS sparkle @keyframes 1.5s infinite |
| لسان تبديل (Tab Switch) | لا يوجد SVGA صريح في السورس | — | — | — | — | يُحاكى بـ framer-motion transition duration 200ms ease-out |
| فتح/إغلاق النافذة | لا يوجد XML صريح | — | — | — | — | يُحاكى بـ AnimatePresence scale 0.92→1 + opacity 0→1, duration 200ms spring damping=22 |
| زر ضغط | لا يوجد XML صريح | — | — | — | — | CSS :active scale 0.95 + filter brightness 0.85 |
| انتقالات لسان الصفحة | لا يوجد XML صريح | — | — | — | — | scroll pagination or empty (no animation in source) |

**ملاحظة مهمة**: لا تخترع حركات غير موجودة في السورس. الحركات المذكورة أعلاه مبنية على SVGA references في XML. عند عدم توفر ملف SVGA، استخدم CSS shimmer/pulse كبدائل موثّقة.

---

## 6) الحالات والتفاعل

| العنصر | عادي | ضغط | معطّل |
|---|---|---|---|
| زر الإغلاق X | opacity 1 | scale 0.95 + opacity 0.7 | N/A |
| كبسولة الماس | opacity 1 | scale 0.97 (يشير لفتح ChargeDialog) | opacity 0.5 إذا gold=0 |
| كبسولة الذهب | opacity 1 | scale 0.97 | opacity 0.5 |
| لسان ذهب | bg=left_check, text white | لا يتغير (نشط) | لا يوجد |
| لسان ماس | bg=middle_check (مُخمن), text white | لا يتغير (نشط) | لا يوجد |
| لسان اشتراكات | bg=right_check (مُخمن), text white | لا يتغير | لا يوجد |
| بطاقة الماس | border 1px accent color | scale 1.03 + border 1.5px accent + glow shadow | opacity 0.5 (إذا pkg.disabled=true) |
| زر الشراء | bg=btn_shop.9.png | scale 0.95 + filter brightness 0.85 | opacity 0.5 (إذا pkg.soldOut=true) |
| زر تفاصيل الماس | bg=shop_item_tail_bg.9.png | scale 0.97 | — |

---

## 7) التجاوب (Responsive)

| الشاشة | العرض | الارتفاع | الاختبار |
|---|---|---|---|
| 360×800 | reference | reference | ✓ جميع النسب المئوية تطابق |
| 412×915 | scale ×1.12 | scale ×1.14 | ✓ الرفوف تتمدد أفقياً، البطاقات تتسع قليلاً |
| 375×667 | scale ×1.04 | scale ×0.83 (شاشة قصيرة) | ✓ الرف 3 + الزر السفلي قد يتداخلان — استخدم scroll-y:auto |
| 720×1280 | scale ×2 | scale ×1.6 | ✓ نفس النسب، أبعاد أكبر |

القواعد:
1. الحاوية: `width: min(96vw, 360px); height: min(92vh, 640px);`
2. جميع الأبعاد بـ dip → px على شاشة xxhdpi (1dip ≈ 3px)
3. الرفوف: عرض 100% — يتمدد أفقياً
4. البطاقات: grid-template-columns: repeat(3, 1fr) — حجم متجاوب

---

## 8) هيكلة البيانات (Data-driven)

### Package Interface:
```ts
interface ChargePackage {
  id: string;                          // 'dia_1' | 'dia_2' | ... | 'dia_6'
  type: 'diamond' | 'gold' | 'vip' | 'royal';
  amount: number;                      // 400, 1800, 5000, 16000, 53700, 161700
  displayAmount?: string;             // '16.0K' override for display
  bonus: number;                       // 0 (no bonus shown in original)
  price: number;                       // 0.99, 3.99, 9.99, 29.99, 99.99, 299.99
  priceFormat: 'USD $X.XX';           // 'USD 0.99'
  label: string;                       // 'حزمة صغيرة'
  iconBg: string;                      // diamonds1.webp path
  badge?: 'none' | 'hot' | 'best' | 'popular';
  order: number;                       // 1-6 (RTL: 1=right, 6=left)
  enabled: boolean;                    // false hides from grid
  royalPoints: number;
  xpReward: number;
}
```

### FirstChargeReward Interface:
```ts
interface FirstChargeRewardItem {
  id: string;
  icon: string;          // asset path
  amount: string;        // '+1' | '+150' | '+15000'
  order: number;
}

interface FirstChargeReward {
  title: string;         // 'مكافأة عند المرة الأولى من الشراء'
  tip: string;           // 'يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية'
  items: FirstChargeRewardItem[]; // 6 items (3×2 grid)
}
```

### Tabs Interface:
```ts
interface Tab {
  key: 'gold' | 'diamond' | 'vip';
  label: string;        // 'ذهب' | 'ألماس' | 'اشتراكات'
  order: number;
  visible: boolean;
}
```

### Super Admin API (لم يُنفّذ بالكامل — البنية فقط):
- `GET /api/admin/shop/packages` — list all packages (4 windows: diamond/gold/vip/royal)
- `POST /api/admin/shop/packages` — add/edit package
- `DELETE /api/admin/shop/packages/:id` — disable package
- `GET /api/admin/shop/first-charge` — get first-charge reward config
- `PUT /api/admin/shop/first-charge` — edit first-charge reward
- `GET /api/admin/shop/logs` — purchase/edit logs

---

## 9) جدول التعارضات (Image vs Source)

| # | الوصف في مواصفات المستخدم | في السورس | القرار | السبب |
|---|---|---|---|---|
| 1 | "زر إغلاق X أخضر/أبيض في أقصى اليسار" | `iv_close` alignParentEnd (يمين) | اتباع مواصفات المستخدم (يسار) | مواصفات المستخدم أحدث (image 2 من نسخة أحدث) |
| 2 | "صورة اللاعب الدائرية في أقصى اليمين" | غير موجود في fragment_shop.xml | إضافة (improve match with image 2) | إضافة لعنصر موجود في نسخة أحدث |
| 3 | "لافتة R0 تحت الصورة" | rle_entranceView (invisible) في fragment_shop.xml | إضافة شارة مرئية تحت الصورة | مطابقة image 2 |
| 4 | "صندوق كنز وردي/ماجنتا بحواف فضية على اليسار + فقاعة كلام بيضاء" | chest_firstcharge.webp + bg_firstcharge.png في `item_shop_guild.xml` | مطابق تماماً ✓ | — |
| 5 | "3×2 grid" داخل الفقاعة | 3×2 grid في `item_shop_guild.xml` L32-58 | مطابق تماماً ✓ | — |
| 6 | "العنوان وسط الأعلى لون أصفر/ذهبي" | 17sp #fff771 centerHorizontal | مطابق ✓ (اللون #fff771 قريب من #FFE066 المذكور) | — |
| 7 | "نص التنبيه تحت الرف: يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية" | `@string/reward_tip` 10sp white | مطابق ✓ | — |
| 8 | "3 رفوف" | shelves.webp مذكور في item_shop_guild.xml L26 مرة واحدة | إضافة الرف 2 + الرف 3 كـ CSS background-image تكرر | الأصل يضع الرفوف كـ padding/bg للـ RecyclerView |
| 9 | "صف 1: 400/0.99 HOT, 1800/3.99, 5000/9.99" | diamonds1-3.webp | مطابق ✓ | — |
| 10 | "صف 2: 16.0K/29.99 Popular, 53.7K/99.99, 161.7K/299.99 BEST" | diamonds4-6.webp | مطابق ✓ | — |
| 11 | "شارات HOT/BEST/Popular في **الزاوية العلوية اليسرى**" | `svg_hot` + `svg_best` layout_gravity=end (يمين) | ⚠️ تعارض — اتباع **السورس (يمين)** | قاعدة: عند الشك، الأولوية للسورس. مُسجّل. |
| 12 | "HOT: شارة دائرية برتقالية-حمراء بشعلة" | svg_hot 35×35dip SVGA animation (ملف غير متوفر) | استخدم label_best.webp (red ribbon) + flame icon (room_icon_member_small_flame.webp) كبديل موثّق | — |
| 13 | "BEST: شريط أحمر بقص راية" | svg_best 60×21dip (FrameLayout with iv_best SVGA + "BEST" text 10sp white) | استخدم label_best.webp (avg #de374d red ribbon) — مطابق ✓ | — |
| 14 | "Popular: شريط وردي/ماجنتا" | (غير مذكور صراحة في السورس — الشائع في item_diamonds.xml) | استخدم label_popular.webp (avg #e96adf pink-magenta ribbon) | — |
| 15 | "زر شراء مستطيل مدور بتدرج أخضر #6CC53A→#4FA82A" | ll_buy bg=btn_shop.9.png (avg #6ecd0a bright green) | مطابق ✓ | — |
| 16 | "نص أبيض عريض بحد داكن" | tv_money 14sp bold #47790c (dark green) stroke_color=#94f534 stroke_width=2dip | مطابق ✓ (اللون أخضر داكن وليس أبيض، لكن النص في السورس أخضر داكن) | — |
| 17 | "الزر السفلي: كبسولة داكنة شبه شفافة بحد رفيع، نص 'تفاصيل الماس >>'" | ctv_detail bg=shop_item_tail_bg.9.png (avg #16644c dark green) text "go_diamonds_detail" 13sp #2bc895 | مطابق ✓ | — |
| 18 | "صيغة السعر 'USD 9.99'" | tv_money text="0.99 USD" | مطابق ✓ (ترتيب الكلمات مختلف قليلاً لكن نفس الصيغة) | — |
| 19 | "عنصر صغير أبيض رأسي على الحافة اليسرى" | غير موجود في fragment_shop.xml | محاكاته بـ CSS (handle 4×40 white 50%) | قد يكون من version أحدث أو عنصر نظام |

---

## 10) قائمة الأصول المستخدمة من السورس

### أصول موجودة ومستخدمة:
- ✓ skin_bg.9.png — خلفية الحاوية
- ✓ skin_close.webp — زر الإغلاق X
- ✓ coin.webp — أيقونة الذهب الصغيرة
- ✓ diamonds.webp — أيقونة الماس الصغيرة
- ✓ jia.webp — زر +
- ✓ shop_switch_left_check.webp — لسان ذهب نشط
- ✓ shop_switch_middle_uncheck.webp — لسان ماس غير نشط
- ✓ shop_switch_right_uncheck.webp — لسان اشتراكات غير نشط
- ✓ shop_switch_gold_check/uncheck.webp — أيقونات لسان ذهب
- ✓ shop_switch_diamond_check/uncheck.webp — أيقونات لسان ماس
- ✓ shop_switch_privilege_check/uncheck.webp — أيقونات لسان اشتراكات
- ✓ shop_top_green_line.9.png — خط الفاصل
- ✓ shop_item_bg.webp — خلفية بطاقة الماس
- ✓ shop_item_tail_bg.9.png — زر تفاصيل الماس
- ✓ btn_shop.9.png — زر الشراء
- ✓ label_best.webp — شارة BEST
- ✓ label_popular.webp — شارة POPULAR
- ✓ shelves.webp — خلفية الرفوف
- ✓ chest_firstcharge.webp — صندوق الكنز
- ✓ bg_firstcharge.png — الفقاعة البيضاء
- ✓ recharge_room_gift.webp — أيقونة الهدية/الوردة
- ✓ charge_reward_profile_card.webp — أيقونة الإطار/الراية
- ✓ charge_reward_head_decor.webp — أيقونة الخاتم/الإكليل
- ✓ charge_reward_head_frame.webp — أيقونة الإطار الذهبي
- ✓ diamonds1-6.webp — أيقونات البطاقات الستة
- ✓ fast_pay_first_reward_tip_ic.webp — أيقونة tip بجانب العنوان
- ✓ royal_level_0-5.webp — شارة مستوى رويال (لـ R0/R1/R2/R3/R4/R5 تحت الصورة)

### أصول غير موجودة في السورس (بدائل موثّقة):
- ⚠️ svg_hot SVGA animation — بديل: label_best.webp + flame icon (room_icon_member_small_flame.webp) + CSS pulse
- ⚠️ svg_best SVGA animation — بديل: label_best.webp (شريط أحمر راية ساكن)
- ⚠️ svg_stars SVGA animation — بديل: CSS sparkle @keyframes 1.5s infinite
- ⚠️ twinkle_point SVGA (iv_twinkle) — بديل: CSS twinkle shimmer @keyframes 2s ease-in-out infinite
- ⚠️ shop_switch_middle_check.webp — غير موجود — بديل: استخدم shop_switch_left_check.webp (مطابق لونياً)

---

## 11) المخرجات النهائية

1. ✅ هذا الملف (GEM_SHOP_SPEC.md)
2. ⏳ الكود المعدّل ChargeDialog.tsx (سيُنتج لاحقاً في هذه الجلسة)
3. ⏳ لقطات الشاشة + Diff + جدول مطابقة (سيُنتج بعد البناء)
4. ⏳ Commit + Push إلى GitHub main

---

## 12) ملخص للتنفيذ القادم

بناءً على هذا الـ SPEC، سأعيد بناء `ChargeDialog.tsx` بالكامل ليكون نسخة طبق الأصل 100%:
- full-screen مع skin_bg.9.png + vignette (لا إطار خارجي)
- top bar: X يسار + رصيد ماس + رصيد ذهب (centered) + صورة لاعب يمين مع شارة R0 تحتها
- 3 tabs بـ shop_switch_*_check/uncheck.webp
- shop_top_green_line.9.png divider
- first-charge reward area: title (yellow) + shelves.webp + chest_firstcharge.webp (يسار) + bg_firstcharge.png bubble بـ 3×2 grid
- alert text "يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية"
- packages grid 3×2 بـ item_diamonds.xml structure (107×150dip per card)
- 6 بطاقات بأرقام مطابقة (400, 1800, 5000, 16.0K, 53.7K, 161.7K) وأيقونات مختلفة (diamonds1-6.webp)
- شارات: HOT (red+flame), BEST (label_best.webp), Popular (label_popular.webp) — أعلى يمين (اتباع السورس)
- زر شراء بـ btn_shop.9.png + "USD X.XX" 14sp bold #47790c
- زر سفلي "تفاصيل الماس >>" بـ shop_item_tail_bg.9.png 13sp #2bc895
- shelves 3 مرات كـ CSS background-image بين الصفوف

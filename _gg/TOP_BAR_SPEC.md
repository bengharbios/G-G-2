# TOP_BAR_SPEC.md — أصول الشريط العلوي والعناصر المحفورة

> المرجع: السورس الأصلي (layout XML + أصول الصور) + مواصفات المستخدم.

---

## 1) تدقيق الأصول في السورس

### [1-A] كبسولات الماس والذهب (inset capsule frame)

**السورس**: `bg_add_coin.xml` (shape drawable — solid #0c3c30 + radius 10dip)

```xml
<!-- /public/yalla-ui/full/bg_add_coin.xml -->
<shape android:shape="rectangle" xmlns:android="...">
    <corners android:radius="10.0dip" />
    <solid android:color="#ff0c3c30" />
</shape>
```

- **المسار**: `/yalla-ui/full/bg_add_coin.xml`
- **الأبعاد في السورس**: `75×20dip` (من fragment_shop.xml L8, L12)
- **اللون الأساسي**: `#0c3c30` (dark green — أغمق من الشريط حولها)
- **نصف القطر**: 10dip (حواف دائرية كاملة)
- **الطبقات**:
  - solid fill: #0c3c30
  - (لا يوجد stroke صريح، لكن في الصورة الأصلية تظهر الحافة السفلية أفتح قليلاً)
- **التطبيق**: استخدم `background: #0c3c30; border-radius: 10px;` مع `box-shadow: inset 0 1px 0 rgba(0,0,0,.4), inset 0 -1px 0 rgba(255,255,255,.08);` لمحاكاة الظل الداخلي العلوي والحافة السفلية الفاتحة

### [1-B] دائرة الرويال المحفورة + لافتة R

**السورس**: لا يوجد ملف واحد يرسم الدائرة — تتكون من:
- دائرة بخلفية داكنة + إطار خارجي + ظل داخلي (محفور): لا يوجد في السورس، يُحاكى بـ CSS
- أيقونة الرويال: `royal_level_0.webp` ~ `royal_level_5.webp` (477×411، 6 مستويات)

**التحقق من السورس**:
- `rle_entranceView` في `fragment_shop.xml` L5 (marginStart=5, marginTop=3, alignParentStart=true)
- في RTL = أعلى يمين
- `android:visibility="invisible"` (افتراضياً) — لكنها تصبح مرئية عند وجود رويال
- **السلوك**: يفتح RoyalDialog عند الضغط (مطابق لما لدينا)

**الأبعاد التقريبية**: قطر ≈38dip (في الصورة A)

**التطبيق**:
- دائرة 40×40dip، bg gradient #2DA887→#1F7A5F
- border: 2px solid #5DD7A6 (إطار أخضر فاتح)
- box-shadow: `inset 0 1px 0 rgba(0,0,0,.3)` (ظل داخلي علوي)
- بداخلها: `royal_level_N.webp` (28×28dip)
- لافتة "R"+المستوى: كبسولة صغيرة 22×12، bg #fbbf24، أسفل الدائرة وتتداخل معها

### [1-C] إطار زر "تفاصيل الماس >>" السفلي

**السورس**: `shop_item_tail_bg.9.png` (9-patch PNG)

- **المسار**: `/yalla-ui/shop/shop_item_tail_bg.9.png` (نسخة من /yalla-ui/full/)
- **الأبعاد**: 106×82 (الصورة الأصلية)، تُعرض في 191×25dip (من view_shop_diamonds.xml L7)
- **متوسط اللون**: `#16644c` (dark green)
- **9-slice borders**: الصورة 9-patch — الحواف العلوية والسفلية واليسرى واليمنى قابلة للتمدد
- **الطبقات**:
  - bg: #16644c
  - ظل داخلي علوي (محفور): يُحاكى بـ `inset 0 1px 0 rgba(0,0,0,.3)`
  - حافة سفلية فاتحة: يُحاكى بـ `inset 0 -1px 0 rgba(255,255,255,.08)`

### [1-D] الرف (shelf)

**السورس**: `shelves.webp` (صورة واحدة كاملة)

- **المسار**: `/yalla-ui/full/shelves.webp` (نسخة)
- **الأبعاد**: 1091×290 (الصورة الأصلية)، تُعرض في 316×84dip (من item_shop_guild.xml L26)
- **متوسط اللون**: `#3eceaa` (bright teal-green)
- **شكل الرف في الأصل** (موصوف من المستخدم + الصورة):
  - منصة بسطح علوي فاتح شبه شفاف على شكل شبه منحرف
  - جانبان مائلان
  - حافة أمامية بارزة (Bevel)
  - مسمارين صغيرين عند طرفي الحافة الأمامية

**التطبيق**: استخدم `shelves.webp` كصورة كاملة بعرض الشاشة (`width: 100%; height: 84dip`).

### [1-E] أيقونة الإغلاق X

**السورس**: `skin_close.webp`

- **المسار**: `/yalla-ui/full/skin_close.webp` (نسخة)
- **الأبعاد**: 48×49 (الصورة الأصلية)، تُعرض في 24×24dip
- **متوسط اللون**: `#68cf8f` (bright green — أخضر فاتح)
- **الطبقات**: شفاف خارج حدود X، أخضر فاتح داخل X

### [1-F] صندوق الكنز الوردي

**السورس**: `chest_firstcharge.webp`

- **المسار**: `/yalla-ui/full/chest_firstcharge.webp`
- **الأبعاد**: 158×131 (الصورة الأصلية)، تُعرض في 72×54dip (من item_shop_guild.xml L30)
- **متوسط اللون**: `#a990a6` (grayish-magenta — يظهر وردياً/ماجنتا في العرض)
- **الطبقات**:
  - جسم الصندوق وردي/ماجنتا
  - حواف فضية (bevel)
  - قفل ذهبي
- **السلوك**: يظهر على اليسار، قاعدته تلامس سطح الرف

### [1-G] فقاعة الكلام البيضاء

**السورس**: `bg_firstcharge.png` (9-patch — نسخة `.9.png`)

- **المسار**: `/yalla-ui/shop/bg_firstcharge.png` (نسخة) أو `/yalla-ui/full/bg_firstcharge.9.png`
- **الأبعاد**: 296×162 (الصورة الأصلية)، تُعرض في 150×85dip (من item_shop_guild.xml L31)
- **متوسط اللون**: `#cffee3` (very light green-white)
- **9-slice borders**: 9-patch — تتمدد مع الحفاظ على شكل الفقاعة المدورة والذيل
- **الطبقات**:
  - خلفية بيضاء/خضراء فاتحة مدورة
  - ذيل يشير إلى الصندوق (في الأصل، الذيل على اليسار لأن الفقاعة على يمين الصندوق)

### [1-H] بطاقة الباقة (shop_item_bg)

**السورس**: `shop_item_bg.webp` (موجود في `item_diamonds.xml` L6)

- **المسار**: `/yalla-ui/shop/shop_item_bg.webp`
- **الأبعاد**: 367×515 (الصورة الأصلية)، تُعرض في 107×150dip
- **متوسط اللون**: `#5acce0` (light cyan-blue)
- **الطبقات** (مدمجة في الصورة!):
  - إطار خارجي فاتح (3-5px) بحواف مدورة 10px
  - كبسولة رقم داكنة في الأعلى (y=5-15%)
  - توهج دائري ناعم خلف الأيقونة (y=20-30%)
  - تدرج لوني عمودي كامل
  - منطقة أغمق للزر في الأسفل (y=75-95%)

**التطبيق**: استخدم shop_item_bg.webp كخلفية كاملة بـ `object-fit: fill`.

### [1-I] زر الشراء (btn_shop)

**السورس**: `btn_shop.9.png` (9-patch PNG)

- **المسار**: `/yalla-ui/shop/btn_shop.9.png`
- **الأبعاد**: 131×103 (الصورة الأصلية)، تُعرض في 90×32dip
- **متوسط اللون**: `#6ac609` (bright green — مطابق لـ #6CC53A الموصوف)
- **9-slice borders**: 9-patch — حواف قابلة للتمدد
- **الطبقات**:
  - bg: متدرج أخضر (#6ecd0a علوي فاتح → #4fa82a سفلي أغمق)
  - إبراز علوي فاتح (Highlight)
  - حافة سفلية أغمق (3D bevel)

### [1-J] شارات البطاقات (HOT / BEST / Popular)

**السورس**:
- BEST: `label_best.webp` (192×72، متوسط اللون `#de374d` أحمر — شريط راية)
- Popular: `label_popular.webp` (186×66، متوسط اللون `#e96adf` وردي/ماجنتا — شريط راية)
- HOT: **غير موجود كصورة ساكنة في السورس**
  - في `item_diamonds.xml` L28: `<com.yalla.games.common.view.svga.LudoSVGAView android:id="@id/svg_hot" android:layout_width="35.0dip" android:layout_height="35.0dip" .../>`
  - ملف SVGA غير متوفر في `/assets/` المستخرجة

**البديل الموثّق لـ HOT**:
- إنشاء شارة صغيرة (60×21dip — نفس أبعاد label_best/popular) بحجم وموضع مطابق
- خلفية: شريط راية برتقالي-أحمر (gradient: #ff6b35 → #de374d)
- نص "HOT" أبيض عريض في المنتصف (10sp bold white)
- هذه موثّقة كبديل لعدم توفر svg_hot.svga في السورس

**الخلاصة**:
- BEST و Popular: استخدم `label_best.webp` و `label_popular.webp` مباشرة من السورس ✓
- HOT: بديل CSS موثّق (لا يوجد أصل ساكن في السورس)

---

## 2) مطابقة الترتيب (LTR visual من اليسار لليمين)

| الموقع | العنصر | المصدر |
|---|---|---|
| أقصى اليسار (x≈22) | زر X (skin_close.webp) | fragment_shop.xml L39 iv_close (alignParentEnd في RTL = LEFT) |
| يسار-وسط (x≈68-175) | كبسولة الماس (75×20dip + diamonds.webp 29×29dip على اليمين) | fragment_shop.xml L11-14 rl_diamonds |
| يمين-وسط (x≈185-290) | كبسولة الذهب (75×20dip + coin.webp 29×29dip على اليمين) | fragment_shop.xml L7-10 rl_gold |
| أقصى اليمين (x≈332, ⌀≈38) | دائرة الرويال + لافتة R | fragment_shop.xml L5 rle_entranceView (alignParentStart في RTL = RIGHT) |

**طريقة التطبيق في الكود**:
- بما أن الصفحة كلها `dir="rtl"` (layout.tsx L30)، فإن flex container يرتب الأبناء من اليمين لليسار
- لتحقيق الترتيب البصري المطلوب (X يسار، الرويال يمين)، يجب:
  - DOM order: [Royal, pills, X] → في RTL: X LEFT, pills CENTER, Royal RIGHT ✓
  - أو: set `direction: 'ltr'` على الشريط العلوي (يحافظ على ترتيب DOM)

نختار `direction: 'ltr'` للوضوح ومطابقة ترتيب DOM مع ترتيب بصري.

---

## 3) مطابقة ترتيب الصندوق والفقاعة

| الموقع | العنصر | المصدر |
|---|---|---|
| أقصى اليسار | صندوق الكنز الوردي (chest_firstcharge.webp 72×54dip) | item_shop_guild.xml L30 iv_charge_box |
| يمين الصندوق | فقاعة بيضاء (bg_firstcharge.png 150×85dip) + 3×2 grid | item_shop_guild.xml L31 LinearLayout |

**السورس**: `android:layoutDirection="ltr"` على الـLinearLayout الأب (item_shop_guild.xml L29)

التطبيق: set `direction: 'ltr'` على الحاوية.

---

## 4) مطابقة ترتيب البطاقات (شبكة 3×2)

| الصف | يمين | وسط | يسار |
|---|---|---|---|
| 1 | 400 / USD 0.99 + HOT | 1800 / USD 3.99 | 5000 / USD 9.99 |
| 2 | 16.0K / USD 29.99 + Popular | 53.7K / USD 99.99 | 161.7K / USD 299.99 + BEST |

التطبيق: شبكة `grid-cols-3` بـ `direction: 'rtl'` — أول عنصر في DOM → يمين بصرياً.

---

## 5) الرفوف الثلاثة (مواضعها)

| الرف | الموقع | الوصف |
|---|---|---|
| 1 | تحت منطقة المكافأة | قاعدة الصندوق والفقاعة تلامس سطحه العلوي |
| 2 | تحت الصف 1 من البطاقات | قاعدة كل بطاقة (400/1800/5000) تلامس سطحه |
| 3 | تحت الصف 2 من البطاقات | قاعدة كل بطاقة (16K/53.7K/161.7K) تلامس سطحه |

التطبيق: استخدم `shelves.webp` بعرض كامل + ارتفاع 84dip.

---

## 6) زر "تفاصيل الماس >>" السفلي

| العنصر | القيمة |
|---|---|
| الأصل | shop_item_tail_bg.9.png (9-patch) |
| العرض | 191dip (≈ 184px على المرجع 360) |
| الارتفاع | 25dip |
| اللون | #16644c (dark green) |
| النص | "تفاصيل الماس >>" 13sp bold #2bc895 |
| الزخارف | لا توجد — كبسولة محفورة فقط |

التطبيق: استخدم shop_item_tail_bg.9.png كخلفية + النص فقط — لا توهج بيضاوي ولا شريطين جانبيين.

---

## 7) المقبض الأبيض الصغير على الحافة اليسرى

**التحقق من السورس**: لا يوجد عنصر مقبض في fragment_shop.xml أو view_shop_diamonds.xml.

**الخلاصة**: هذا العنصر **ليس جزءاً من النافذة** في السورس. يُحتمل أن يكون:
1. عنصر نظام من Android (DrawerLayout edge glide)
2. أو من نسخة أحدث من Yalla Ludo غير موجودة في السورس المستخرج

**القرار**: لا يُنسخ (لا يوجد أصل له في السورس).

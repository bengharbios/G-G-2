# 📋 تجميع شامل: سورس yalla ludo لصفحة الألعاب

هذا الملف يجمّع كل المعلومات التي جمعناها من سورس yalla ludo APK
لتصميم صفحة الألعاب بشكل مطابق للأصل (ويب فقط، لا APK).

---

## 🎮 الهيكل العام لـ `activity_game_hall.xml`

```
FrameLayout (main_hall)
└── LinearLayout (ll_main) — bg=bg_hall، keepScreenOn=true
    ├── FrameLayout (fl_main_header) — bg=friends_titlebg (شريط علوي 51dp)
    │   └── main_header (51dp) — header مخصص بالذهب + الماس + السلة + الإعدادات
    ├── ViewPager (viewPager) — يحمل 4 صفحات (ludo/domino/jackaroo/other)
    └── game_hall_bottom (75dp) — شريط سفلي 4 تبويبات
```

## 📱 صفحات الـ ViewPager (4 صفحات)

التنقل بين الصفحات يحدث عبر:
1. **ViewPager** (انزلاق أفقي) بين 4 صفحات
2. **أزرار `game_select_*`** في الأعلى (4 أزرار: ludo/domino/jackaroo/other)

### 1. صفحة Ludo (`battle_ludo.xml`)
**العنوان**: `iv_ludo_logo` (200×80dp, src=ludo_title)
**5 أزرار أوضاع:**

| الزر | ID | الحجم | الصورة | النص | StrokeColor |
|---|---|---|---|---|---|
| 2&4 Players | `iv_ludo_2p` | 167×134dp | `svg_ludo_2ren.webp` | "2&4 Players" | `#A0631C` |
| Team | `iv_ludo_4p` | 167×134dp | `svg_ludo_4ren.webp` | "Team" | `#504593` |
| Tournament | `iv_ludo_championship` | 111×99dp | `svg_ludo_tournament.webp` | "Tournament" | `#387E12` |
| Private&Local | `iv_ludo_local` | 111×99dp | `svg_ludo_local.webp` | "Private&Local" | `#0D6C8C` |
| VIP Room | `iv_ludo_friends` | 111×99dp | `svg_ludo_vip.webp` | "VIP Room" | `#99372B` |

### 2. صفحة Domino (`battle_domino.xml`)
**العنوان**: `iv_title` (200×50dp, src=domino_title)
**5 أزرار أوضاع:**

| الزر | ID | الحجم | الصورة | النص | StrokeColor |
|---|---|---|---|---|---|
| 1 ON 1 | `iv_domino_2p` | 166×130dp | `svg_domino_2ren.webp` | "1 ON 1" | `#2A7BB4` |
| 4 Players | `iv_domino_4p` | 166×130dp | `svg_domino_4ren.webp` | "4 Players" | `#504593` |
| Tournament | `iv_domino_championship` | 111×99dp | `svg_domino_tournament.webp` | "Tournament" | `#387E12` |
| Private | `iv_domino_private` | 111×99dp | `svg_domino_private.webp` | "Private" | `#B76224` |
| VIP Room | `iv_domino_friends` | 111×99dp | `svg_domino_vip.webp` | "VIP Room" | `#99372B` |

### 3. صفحة Jackaroo (`battle_jackaroo_view.xml`)
**العنوان**: `iv_jackaroo_logo` (250×80dp, src=jackaroo_logo)
**4 أزرار أوضاع:**

| الزر | الحجم | الصورة | النص | StrokeColor |
|---|---|---|---|---|
| 1v1 Quick | 150×229dp | `bg_jackaroo_enter_1v1.png` | G_1450_0053 | `#0F7D00` |
| Classic | 180×110dp | `bg_jackaroo_basic_enter.png` | G_1430_97 | `#1E6887` |
| Complex | 88×115dp | `bg_jackaroo_complex_enter.png` | G_1430_98 | `#B64E02` |
| VIP | 88×115dp | `bg_jackaroo_vip_enter.png` | VIP Room | `#B64E02` |

### 4. صفحة Other Games (`battle_other_view.xml`)
**العنوان**: `iv_other_logo` (168×50dp, src=others_icon)
**5 أزرار ألعاب:**

| الزر | الحجم | الصورة | النص | StrokeColor |
|---|---|---|---|---|
| Jungle Ludo | 160×127dp | `other_jungle_ludo.webp` | G_1392_8 | `#C06C2E` |
| Lucky Ludo | 160×127dp | `other_default_lucky_ludo.webp` | G_1500_0032 | `#732B99` |
| Snake 2p | 106×95dp | `other_snake_mode.webp` | G_1340_2 | `#670ABE` |
| Fight Ludo | 106×95dp | `other_fight_ludo.webp` | G_1370_062 | `#3D8815` |
| Night Ludo | 106×95dp | `other_night_ludo.webp` | G_1340_22 | `#0B80C3` |

---

## 🎛️ شريط أزرار تبديل الألعاب (4 أزرار في الأعلى)

كل زر له حالتان (select/unselect):

| اللعبة | Select | Unselect |
|---|---|---|
| Ludo | `game_select_ludo_icon_select.webp` | `game_select_ludo_icon_unselect.webp` |
| Domino | `game_select_domino_icon_select.webp` | `game_select_domino_icon_unselect.webp` |
| Jackaroo | `game_select_jackaroo_icon_select.webp` | `game_select_jackaroo_icon_unselect.webp` |
| Other | `game_select_other_icon_select.webp` | `game_select_other_icon_unselect.webp` |

---

## 🎯 شريط الرابطة (`fragment_battle_main.xml` — `ll_rank`)

50dp height، خلفية `icon_rank_my` (يسار) + `icon_rank_global` (يمين):
- **يسار** (`rl_rank_my`): كأس الدوري + قفل + نص "League" (11sp, stroke #154A3D)
- **يمين** (`rl_rank_global`): كأس عالمي + نص "Rank" (11sp, stroke #154A3D)

---

## 🌙 الهيرو (الهلال + الشعار)

```xml
<FrameLayout weight=0.4>
  <View hall_title_bg 105dp marginTop=80dp />  <!-- خلفية -->
  <ImageView svga hall_title_svga_bg />  <!-- هلال متحرك (svga) -->
  <ImageView bottom hall_title_bg 200dp />  <!-- هلال سفلي -->
</FrameLayout>
```

---

## 📊 الشريط السفلي لـ yalla ludo (`table_game_hall.xml`)

73dp height، 4 تبويبات بأوزان متساوية (`weight=1`):

| التبويب | ID | icon (unselect) | select_icon | النص |
|---|---|---|---|---|
| Events | `events_item` | `main_event_un_select_src` | `main_event_select_src` | events |
| Battle | `battle_item` | `main_battle_un_select_src` | `main_battle_select_src` | battle |
| Room | `room_item` | `main_chat_un_select_src` | `main_chat_select_src` | chat_in_hall_name |
| Social | `friend_item` | `main_social_un_select_src` | `main_social_select_src` | social |

---

## 🖼️ الصور المتاحة (51 صورة في `_gg/public/battle/`)

### عناوين الألعاب:
- `ludo_title.webp` (200×80dp)
- `domino_title.webp` (200×50dp)
- `jackaroo_logo.webp` (250×80dp)
- `others_icon.webp` (168×50dp)

### أزرار Ludo (5):
- `svg_ludo_2ren.webp` (167×134dp) — stroke `#A0631C`
- `svg_ludo_4ren.webp` (167×134dp) — stroke `#504593`
- `svg_ludo_tournament.webp` (111×99dp) — stroke `#387E12`
- `svg_ludo_local.webp` (111×99dp) — stroke `#0D6C8C`
- `svg_ludo_vip.webp` (111×99dp) — stroke `#99372B`

### أزرار Domino (5):
- `svg_domino_2ren.webp` (166×130dp) — stroke `#2A7BB4`
- `svg_domino_4ren.webp` (166×130dp) — stroke `#504593`
- `svg_domino_tournament.webp` (111×99dp) — stroke `#387E12`
- `svg_domino_private.webp` (111×99dp) — stroke `#B76224`
- `svg_domino_vip.webp` (111×99dp) — stroke `#99372B`

### أزرار Jackaroo (4):
- `bg_jackaroo_enter_1v1.png` (150×229dp) — stroke `#0F7D00`
- `bg_jackaroo_basic_enter.png` (180×110dp) — stroke `#1E6887`
- `bg_jackaroo_complex_enter.png` (88×115dp) — stroke `#B64E02`
- `bg_jackaroo_vip_enter.png` (88×115dp) — stroke `#B64E02`

### أزرار Other Games (5):
- `other_jungle_ludo.webp` (160×127dp) — stroke `#C06C2E`
- `other_default_lucky_ludo.webp` (160×127dp) — stroke `#732B99`
- `other_snake_mode.webp` (106×95dp) — stroke `#670ABE`
- `other_fight_ludo.webp` (106×95dp) — stroke `#3D8815`
- `other_night_ludo.webp` (106×95dp) — stroke `#0B80C3`

### أزرار تبديل الألعاب (8):
- `game_select_ludo_icon_select.webp` + `game_select_ludo_icon_unselect.webp`
- `game_select_domino_icon_select.webp` + `game_select_domino_icon_unselect.webp`
- `game_select_jackaroo_icon_select.webp` + `game_select_jackaroo_icon_unselect.webp`
- `game_select_other_icon_select.webp` + `game_select_other_icon_unselect.webp`

### شريط الرابطة:
- `icon_rank_my.webp` — خلفية شريط يسار
- `icon_rank_global.webp` — خلفية شريط يمين
- `battle_cup_seg_1.svga_static.png` — كأس الدوري (يسار)
- `rank_global.webp` — كأس عالمي (يمين)
- `lock.webp` — قفل

### الهيرو + الخلفية:
- `hall_title_bg.webp` (الهلال)
- `bg_hall.webp` (خلفية الصفحة)
- `bottom_desk.webp` (المكتب السفلي)
- `entrance_ludo.webp` (دخول لودو)

---

## 🎨 الألوان المستعملة في النصوص (text-stroke)

| اللعبة | اللون |
|---|---|
| Ludo 2p | `#A0631C` |
| Ludo 4p / Domino 4p | `#504593` |
| Ludo/Domino Tournament | `#387E12` |
| Ludo Local | `#0D6C8C` |
| Ludo/Domino VIP | `#99372B` |
| Domino 2p | `#2A7BB4` |
| Domino Private | `#B76224` |
| Jackaroo 1v1 | `#0F7D00` |
| Jackaroo Classic | `#1E6887` |
| Jackaroo Complex/VIP | `#B64E02` |
| Jungle Ludo | `#C06C2E` |
| Lucky Ludo | `#732B99` |
| Snake 2p | `#670ABE` |
| Fight Ludo | `#3D8815` |
| Night Ludo | `#0B80C3` |

---

## 📐 نمط النصوص (StrokeTextView)

```xml
android:textColor="#ffffffff"
android:textStyle="bold"
app:stroke_color="#ff{hex}"
app:stroke_width="1.0dip"
paint-order="stroke fill"
```

---

## 🔄 طريقة التنقل بين الألعاب

1. **انزلاق أفقي** (ViewPager) بين الصفحات الأربع
2. **نقر زر game_select_*_icon** في الأعلى للتنقل المباشر
3. **الحالة النشطة**: select_icon (مع icon مرئي)
4. **الحالة العادية**: unselect_icon

---

## ✅ الخطة للتطبيق على الويب

### المرحلة 1: نقل 51 صورة → `public/battle/`
✅ تم (51 صورة جاهزة في `_gg/public/battle/`)

### المرحلة 2: إضافة 4 صفحات (Ludo/Domino/Jackaroo/Other)
- إنشاء `BattleLudo.tsx` (5 أزرار)
- إنشاء `BattleDomino.tsx` (5 أزرار)
- إنشاء `BattleJackaroo.tsx` (4 أزرار)
- إنشاء `BattleOther.tsx` (5 أزرار)

### المرحلة 3: شريط أزرار تبديل الألعاب
- `GameSelectBar.tsx` (4 أزرار select/unselect)
- يبدّل بين الصفحات الأربع

### المرحلة 4: شريط الرابطة + الهيرو
- `RankBar.tsx` (50dp — كأس + قفل + نص League/Rank)
- `BattleHero.tsx` (114dp — الهلال + شعار اللعبة)

### المرحلة 5: دمج في `page.tsx`
- استبدال الـ GamesSection الحالية بـ `BattlePage.tsx` كامل

---

هذا الملف مرجع شامل للتصميم — يمكن العودة إليه في أي وقت.

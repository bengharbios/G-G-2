# SETTINGS_SPEC.md — نافذة الإعدادات (Settings)

> المرجع: السورس `dialog_setting.xml` + `dialog_setting2.xml` + أصول الصور.

## القائمة الكاملة للصفوف (من السورس)

الترتيب الكامل داخل ScrollView (dialog_setting.xml):

1. **الصوت (Sound) + الموسيقى (Music)** — صف واحد، نص يميناً + Toggle يساراً (btn_on/btn_off)
2. **اللغة (Language)** — نص "اللغة" يميناً + زر أخضر صغير (btn_language) بأيقونة قلم (icon_change_language) ونص اللغة يساراً
3. *(مخفي)* **Update Cocos** — tv_update (visibility=gone)
4. **إعدادات الخصوصية (Privacy Setting)** — زر باهت (delete_account.webp bg، #70af9e)
5. **رمز الاستبدال (CD Key)** — زر باهت (delete_account.webp bg، #70af9e)
6. **مركز الألعاب (Game Center)** — زر باهت (12sp #70af9e)
7. **اختبار الشبكة (Network Test)** — زر باهت (delete_account.webp bg، #70af9e)
8. **إعلانات الخصوصية (Ad Privacy)** — زر باهت (delete_account.webp bg، #70af9e)
9. **حذف الحساب (Delete Account)** — زر باهت (delete_account.webp bg، #70af9e)

كل زر باهت: 166×44dip، bg=delete_account.webp، textColor=#70af9e، 18sp (ما عدا Game Center 12sp)
بين كل صفين: فاصل line_gray.webp (fitXY، marginStart=10، marginEnd=10)

## جدول الأصول

| الأصل | المسار | الأبعاد | اللون | الاستخدام |
|---|---|---|---|---|
| btn_faq.webp | /yalla-ui/full/ | 237×200 | #43cea9 | زر المساعدة (FAQ) |
| fb_home.webp | /yalla-ui/full/ | 158×132 | #43cea9 | زر الصفحة الرئيسية |
| btn_share.webp | /yalla-ui/full/ | 237×200 | #38caa3 | زر المشاركة |
| btn_rateus.webp | /yalla-ui/full/ | 158×133 | #48cfab | زر البريد |
| btn_on.webp | /yalla-ui/full/ | 153×77 | #72f27a | Toggle مفتوح |
| btn_off.webp | /yalla-ui/full/ | 153×77 | #cfdad7 | Toggle مغلق |
| btn_language.webp | /yalla-ui/full/ | 291×72 | #5bc8aa | زر اللغة |
| icon_change_language.webp | /yalla-ui/full/ | 59×62 | #ffffff | قلم زر اللغة |
| delete_account.webp | /yalla-ui/full/ | 519×137 | #ace1d3 | خلفية الأزرار الباهتة |
| line_gray.webp | /yalla-ui/full/ | 866×4 | #bcd0cb | فاصل متقطع |
| bg_feed_back_detail.9.png | /yalla-ui/full/ | 146×146 | #c6ded8 | خلفية اللوحة القابلة للتمرير |
| skin_close.webp | /yalla-ui/full/ | 48×49 | #64c78a | زر X الإغلاق |
| privacy_terms.webp | /yalla-ui/full/ | 48×48 | #e0fbf4 | أيقونة روابط الخصوصية |

## بنية النافذة

```
┌──────── إطار أخضر-teal مدور ────────┐
│  [X]      الإعدادات [⚙]             │  ← الرأس
│                                      │
│  [FAQ] [Home] [Share] [Mail]         │  ← 4 أزرار اختصار (78×65dip)
│                                      │
│  ┌─── لوحة فاتحة قابلة للتمرير ───┐  │
│  │ الصوت [toggle]  الموسيقى [toggle]│  │  ← صف 1
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │  ← فاصل
│  │ اللغة           [English ✎]     │  │  ← صف 2
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │
│  │  [ إعدادات الخصوصية ]          │  │  ← صف 3 (زر باهت)
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │
│  │  [ رمز الاستبدال ]            │  │  ← صف 4
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │
│  │  [ مركز الألعاب ]              │  │  ← صف 5
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │
│  │  [ اختبار الشبكة ]            │  │  ← صف 6
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │
│  │  [ إعلانات الخصوصية ]          │  │  ← صف 7
│  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  │
│  │  [ حذف الحساب ]              │  │  ← صف 8
│  └────────────────────────────────┘  │
│                                      │
│  [مركز الحساب]     [تسجيل الخروج]    │  ← أزرار سفلية
│                                      │
│  الإصدار 1.5.1.0   سياسة | شروط     │  ← تذييل
└──────────────────────────────────────┘
```

## الأزرار الباهتة
- لون #70af9e (أخضر-تيل باهت) — هذا لونها الطبيعي (وليس معطّل)
- bg=delete_account.webp (خلفية فاتحة شفافة #ace1d3)
- كلها 166×44dip
- قابلة للضغط (تفتح نوافذ فرعية أو تنتقل لصفحات)

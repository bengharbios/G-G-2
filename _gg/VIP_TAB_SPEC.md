# VIP_TAB_SPEC.md — تبويب الاشتراكات (VIP Subscriptions)

> المرجع: السورس الأصلي (layout XML + أصول الصور) + صور الأصل A1/A2.

## 0) المستويات الموجودة في السورس

**مستويان فقط** (لا يوجد غيرهما في السورس المستخرج):
1. **الفارس (Knight)** — درع أزرق بسيف
2. **اللواء (Baron)** — شارة بنفسجية بأجنحة وسيف

المصدر: `item_shop_privileges.xml` L14-25 (fl_switch_knight + fl_switch_baron فقط)

## 1) جدول الأصول

| الأصل | المسار | الأبعاد | اللون (avg) | الاستخدام |
|---|---|---|---|---|
| shop_privileges_left_check.webp | /yalla-ui/full/ | 618×136 | #29b488 | خلفية لسان الفارس النشط |
| shop_privileges_left_normal.webp | /yalla-ui/full/ | 618×136 | #1e966f | خلفية لسان الفارس غير النشط |
| shop_privileges_right_check.webp | /yalla-ui/full/ | 618×136 | #2ab58a | خلفية لسان اللواء النشط |
| shop_privileges_right_normal.webp | /yalla-ui/full/ | 618×136 | #1f9871 | خلفية لسان اللواء غير النشط |
| shop_privileges_knight_ic.webp | /yalla-ui/full/ | 69×76 | #4c849f | أيقونة صغيرة للفارس (داخل اللسان) |
| shop_privileges_baron_ic.webp | /yalla-ui/full/ | 84×74 | #797da0 | أيقونة صغيرة للواء (داخل اللسان) |
| shop_privileges_detail_bg.9.png | /yalla-ui/full/ | 1222×378 | #157153 | خلفية لوحة الامتيازات (9-patch) |
| shop_privileges_bottom_info_bg.9.png | /yalla-ui/full/ | 21×316 | #208a69 | خلفية الشريط السفلي (9-patch) |
| shop_privileges_label_bottom_ic.webp | /yalla-ui/full/ | 389×118 | #3c9c76 | لافتة سفلية |
| question_icon.webp | /yalla-ui/full/ | 65×70 | #cfcfcf | زر "؟" |
| bg_medal_detail_title.webp | /yalla-ui/full/ | 933×435 | #007963 | خلفية منطقة الشارة |
| privilege_detail_knight_ic.webp | /yalla-ui/full/ | 370×324 | #799192 | شارة الفارس الكبيرة |
| privilege_detail_baron_ic.webp | /yalla-ui/full/ | 370×324 | #a5838b | شارة اللواء الكبيرة |
| vip_sub_daily_item_bg.webp | /yalla-ui/full/ | 163×152 | #167054 | خلفية مكافأة يومية |
| vip_sub_rhombus_ic.webp | /yalla-ui/full/ | 32×36 | #c4963c | رصاصة معينة (bullet) |
| signin_item_gold_ic.webp | /yalla-ui/full/ | 72×80 | #e3be4d | أيقونة ذهب (مكافأة يومية) |
| signin_item_diamond_ic.webp | /yalla-ui/full/ | 72×80 | #48bbe2 | أيقونة ماس (مكافأة يومية) |
| box_mail.webp | /yalla-ui/full/ | 146×116 | #839363 | أيقونة صندوق (مكافأة يومية) |
| medal_detail_arrow.webp | /yalla-ui/full/ | — | — | سهم تنقل بين المستويات |
| bn_yes.9.png | /yalla-ui/shop/ | 92×148 | #dab00b | زر الاشتراك (أصفر) |

## 2) بنية التبويب (من الأعلى للأسفل)

```
┌─────────────────────────────────────────┐
│ تبويب الاشتراكات (نشط، أفتح)            │  ← تبويبات (موجودة مسبقاً)
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐                │
│ │ [؟] الفارس │ │ اللواء  │  ← كبسولة تبديل المستوى (39.6dip)  │
│ └─────────┘ └─────────┘                │
│ "أنت لست VIP [المستوى] حتى الآن"        │  ← نص الحالة
│                                         │
│    ┌─────────────────┐                  │
│    │   شارة كبيرة    │  ← شارة المستوى  │
│    │  (درع/أجنحة)    │                  │
│    └─────────────────┘                  │
│      [إضاءة مسرح خضراء]                 │  ← spotlight
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ "امتيازات حصرية"                    │ │  ← كبسولة عنوان
│ ├─────────────────────────────────────┤ │
│ │ [أيقونة]  عنوان    │ [أيقونة] عنوان│ │  ← شبكة عمودين
│ │ وصف رمادي-أخضر      │ وصف           │ │
│ ├──────────────────────┼──────────────┤ │
│ │ [أيقونة]  عنوان    │ [أيقونة] عنوان│ │
│ │ وصف                  │ وصف           │ │
│ └──────────────────────┴──────────────┘ │
│ (قابلة للتمرير عمودياً)                  │
├─────────────────────────────────────────┤
│ ┌──────────────┐ ┌───────────────────┐ │  ← شريط سفلي ثابت
│ │  $11.99      │ │ "اشترك للحصول على │ │
│ │  لمدة شهر    │ │  المزايا اليومية" │ │
│ │  إدارة الاشتراك│ │ [صندوق×1] [ماس] [ذهب]│ │
│ └──────────────┘ └───────────────────┘ │
└─────────────────────────────────────────┘
```

## 3) كبسولة تبديل المستوى (item_shop_privileges.xml L14-25)

- LinearLayout أفقي، 39.6dip ارتفاع، centerHorizontal
- لسان الفارس (يسار): bg=shop_privileges_left_normal (غير نشط) / shop_privileges_left_check (نشط)
  - نص "knight" 14sp bold + drawableStart=shop_privileges_knight_ic
- لسان اللواء (يمين): bg=shop_privileges_right_normal (غير نشط) / shop_privileges_right_check (نشط)
  - نص "baron" 14sp bold + drawableStart=shop_privileges_baron_ic
- زر "؟": question_icon 21×20dip، alignParentEnd، marginTop=15

## 4) منطقة الشارة

- bg_medal_detail_title.webp كخلفية (167.8dip ارتفاع)
- شارة كبيرة في الوسط: privilege_detail_knight_ic.webp (فارس) أو privilege_detail_baron_ic.webp (لواء)
- إضاءة خلفية: spotlight (CSS radial gradient أخضر شفاف)
- أسهم: medal_detail_arrow.webp على الجوانب للتنقل

## 5) لوحة الامتيازات (item_privileges.xml)

- خلفية: shop_privileges_detail_bg.9.png (9-patch)
- شبكة عمودين، كل خانة:
  - أيقونة 55×55dip
  - عنوان 14sp bold أبيض
  - وصف 10sp bold #27c190 (رمادي-أخضر)، سطرين كحد أقصى

الامتيازات (من صورة الأصل):
1. شارة VIP: "شارة وعرض حصري"
2. غرفة VIP: "الحق في إنشاء غرفة VIP"
3. المكافآت اليومية: "اشترك للحصول على المزايا اليومية"
4. تثبيت في الأعلى: "عرض الأولوية في قائمة الأصدقاء"
5. تثبيت في الغرفة: "تثبيت أعلى قائمة المستخدمين المتصلين"
6. إطار الملف الشخصي: "استخدم إطار الملف الشخصي الحصري"

## 6) الشريط السفلي الثابت (dialog_vip_sub.xml)

- زر اشتراك: bn_yes.9.png (200×53dip)
  - "$11.99" (فارس) / "$39.99" (لواء) — 18sp bold stroke #fff08b
  - "sub_vip_one_month" 11sp bold stroke #fff08b
- مكافآت يومية (3 عناصر، كل واحد 53×53dip، bg=vip_sub_daily_item_bg):
  - صندوق: box_mail.webp × 1
  - ماس: signin_item_diamond_ic.webp × 20 (فارس) / × 60 (لواء)
  - ذهب: signin_item_gold_ic.webp × 5727 (فارس) / × 28000 (لواء)
- نص: "daily_benefits" 13sp bold white
- رصاصات معينة: vip_sub_rhombus_ic + نصائح

## 7) البيانات (Data-driven)

```ts
interface VipLevel {
  id: string;               // 'knight' | 'baron'
  name: string;             // 'فارس' | 'لواء'
  badgeIcon: string;        // large badge asset path
  smallIcon: string;         // small tab icon path
  tabBgActive: string;       // active tab background
  tabBgInactive: string;    // inactive tab background
  price: string;             // '$11.99' | '$39.99'
  pricePeriod: string;       // 'sub_vip_one_month'
  dailyRewards: VipDailyReward[];
  privileges: VipPrivilege[];
  themeColor: string;        // accent color
}

interface VipPrivilege {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

interface VipDailyReward {
  id: string;
  icon: string;
  amount: string;
}
```

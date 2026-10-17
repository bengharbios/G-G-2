# تقرير استخراج سورس لعبة flashi.me/f10/diff

> تاريخ الاستخراج: 2026-10-17
> الأداة المستخدمة: `web-reader` (z-ai page_reader) + `curl` للأصول الخارجية
> اللعبة: لعبة اختلاف الصور (Spot the Difference)

---

## 1. نظرة عامة على بنية اللعبة

| العنصر | القيمة |
|--------|--------|
| **العنوان** | لعبة اختلاف الصور |
| **الرابط** | https://www.flashi.me/f10/diff |
| **معرّف اللعبة (userName)** | `f10` |
| **الخلفية التقنية** | Firebase (Auth + Firestore) + JavaScript مُشوَّه (obfuscated) |
| **حجم الصفحة الكامل** | ~2.3 ميجابايت |
| **عدد الصور في اللعبة** | 7,005 صورة موزعة على 6 فئات |

اللعبة محمية بكلمة مرور تُخزَّن في Firebase Authentication، ولا تظهر كلمة المرور في السورس. المنطق يقوم بـ:
1. يستقبل كلمة المرور من المستخدم.
2. يستدعي `auth.signInWithEmailAndPassword(userName + "@...", password)`.
3. عند نجاح الدخول، يقرأ وثيقة Firestore من collection باسم `flashiLogin` بهوية `userName`.
4. يتحقق من `window.location.hostname` ضد قائمة نطاقات مسموحة، فإن طابقت يفتح اللعبة.

> ⚠️ **تنبيه قانوني**: استخراج كلمة المرور أو تجاوزها يتطلب الوصول إلى Firebase Admin وهو غير ممكن من السورس وحده. السورس يحتوي فقط على منطق التحقق العام.

---

## 2. بنية الملفات المستخرجة

```
/home/z/my-project/download/flashi_diff/
├── index_raw.html                 # الصفحة الخام الكاملة (2.3 MB)
├── external_diff.js               # سورس اللعبة الرئيسي المُشوَّه (49.7 KB)
├── inline_scripts/
│   ├── inline_01.js               # Google Analytics gtag (150 bytes)
│   ├── inline_02.js               # بيانات اللعبة + إعداد Firebase (2.28 MB)
│   ├── inline_02_trailing_logic.js # منطق تهيئة Firebase (1.2 KB نظيف)
│   └── inline_03.js               # Cloudflare challenge platform (921 bytes)
├── data_arrays/                   # المصفوفات المُستخرجة من inline_02
│   ├── photoArray.json            # 1,499 صورة - الفئة الأساسية
│   ├── vmiscArray.json            # 4,841 صورة - misc variations
│   ├── vsceneArray.json           # 525 صورة - scenes
│   ├── vphotoArray.json           # 98 صورة - photos
│   ├── photo3Array.json           # 23 صورة
│   ├── vector3Array.json          # 19 صورة
│   └── _0x5982f3.txt              # جدول التشفير (lookup table)
├── asset_background.png           # خلفية اللعبة (933 KB)
├── asset_f10.png                  # شعار الحقوق (19 KB)
├── asset_favicon1.png             # أيقونة الموقع (5 KB)
├── asset_*.png                    # صورة لعبة كاملة (680 KB)
├── asset_29ltbukrabold.otf        # خط Buckra Bold (178 KB)
├── asset_AlHurraFontBold.ttf      # خط AlHurra Bold (52 KB)
├── page_meta.json                 # بيانات الصفحة الوصفية
├── page_reader_output.json        # مخرجات أداة page_reader الكاملة
└── analysis_summary.json          # ملخص البنية والروابط
```

---

## 3. تحليل معماري تفصيلي

### 3.1. الأصول الخارجية (8 سكربتات)

| # | المورد | النوع | الوظيفة |
|---|--------|------|----------|
| 1 | `googletagmanager.com/gtag/js?id=G-XV87Q160MQ` | Analytics | Google Analytics 4 |
| 2 | `googletagmanager.com/gtag/js?id=UA-162133640-1` | Analytics | Universal Analytics (قديم) |
| 3 | `gstatic.com/firebasejs/8.6.5/firebase-app.js` | Firebase core | نواة Firebase |
| 4 | `gstatic.com/firebasejs/8.6.5/firebase-analytics.js` | Firebase | تتبع Firebase |
| 5 | `gstatic.com/firebasejs/8.6.5/firebase-firestore.js` | Firestore | قاعدة بيانات اللعبة |
| 6 | `gstatic.com/firebasejs/8.6.5/firebase-auth.js` | Auth | المصادقة (كلمة المرور) |
| 7 | `../flashi-js/diff.js` ⭐ | **منطق اللعبة** | السورس الرئيسي للعبة |
| 8 | `cloudflareinsights.com/beacon.min.js` | Cloudflare | تحليلات |

### 3.2. السورس الرئيسي `diff.js` (49.7 KB)

الملف مُشوَّه بأداة مثل **JavaScript Obfuscator**. الأنماط المستخدمة:
- متغيرات بأسماء `_0x1269a1`, `_0x434336`, `_0x5bda`, `_0x24f9`...
- دالة فك تشفير `function _0x5bda(idx)` تبحث في جدول نصوص ضخم (`_0x24f9`).
- استخدام `parseInt(...)` بأرقام سداسية عشرية كاختبار للتشغيل (`0x26c`, `0x6ac7d`).

**الدوال المرئية (37 دالة):**

| الدالة | الوظيفة المتوقعة |
|--------|------------------|
| `checkPass` | التحقق من كلمة المرور عبر Firebase Auth |
| `enterKey` | الاستجابة لمفتاح Enter |
| `showSettings` | إظهار إعدادات اللعبة (الوقت، عدد الأخطاء) |
| `startGame` | بدء جولة جديدة |
| `startTimer` | تشغيل المؤقت |
| `chooseRandomImage` | اختيار صورة عشوائية من المصفوفة |
| `setImageArrays` | تهيئة مصفوفات الصور |
| `prepareCircles` | رسم دوائر حول مناطق الاختلاف |
| `puzzClick` | معالجة نقر المستخدم على الصورة |
| `wrongClick` | معالجة النقر الخاطئ |
| `solve` | حل الجولة |
| `showAnswers` | إظهار الإجابات |
| `prepareForScore` | تجهيز بيانات النتيجة |
| `createScoreTable` | إنشاء جدول النتائج |
| `showMyScore` | عرض نتيجة المستخدم |
| `endGame` | إنهاء الجولة |
| `randomCode` / `randomDocName` | توليد معرّفات عشوائية لجلسات Firestore |
| `createDocument` / `sendNewGame` | إنشاء وثيقة جلسة في Firestore |
| `deleteOldCodes` / `deleteOldDocuments` | تنظيف الوثائق القديمة |
| `shuffle` | خلط مصفوفة |
| `generateRandomInt` | توليد رقم عشوائي |
| `setTypeSelect` | ضبط نوع اللعبة |
| `changeTimerValue` / `changeWrong` / `changeFinish` / `changeType` | تحديثات واجهة |
| `resetLastScoreArray` / `disableAnswersBtn` | أدوات مساعدة |

### 3.3. البنية البرمجية (منطق التشغيل)

```javascript
// من inline_02.js (الجزء النظيف في النهاية)
var firebaseConfig = {
  'apiKey':         _0x434336(0x1e3),  // مشفّر
  'authDomain':     _0x434336(0x1e6),
  'projectId':      _0x434336(0x1d8),
  'storageBucket':  _0x434336(0x1d9),
  'messagingSenderId': _0x434336(0x1e5),
  'appId':          _0x434336(0x1d5)
};
firebase.initializeApp(firebaseConfig);
var userName = 'f10';
```

```javascript
// من external_diff.js (بعد فك التشفير الجزئي)
var loginAppConfig = {
  'apiKey': _0x5bda(0x232),
  'authDomain': 'flashilogin.firebaseapp.com',   // ← ظاهر نصياً!
  'projectId': _0x5bda(0x1ce),
  'storageBucket': _0x5bda(0x1cf),
  'messagingSenderId': _0x5bda(0x1d3),
  'appId': _0x5bda(0x20a)
};
var loginApp = firebase.initializeApp(loginAppConfig, _0x5bda(0x21d));
const auth = loginApp.auth();
const loginEvents = loginApp.firestore().collection('flashiLogin').doc(userName);
```

### 3.4. آلية كلمة المرور

```javascript
// pseudo-code (منطق checkPass بعد فك التشويش)
function checkPass() {
  auth.signInWithEmailAndPassword(
    userName + "@flashi.me",   // f10@flashi.me
    document.getElementById("passwordInput").value
  ).then(() => {
    auth.onAuthStateChanged(user => {
      if (user) {
        loginEvents.get().then(doc => {
          const data = doc.data();
          state = "...";
          // قائمة النطاقات المسموحة:
          if (["flashi.me", "www.flashi.me", "flashi.com",
               "www.flashi.com", "flashi.games", "..."].includes(
                 window.location.hostname)) {
            common = true; sum = 1;
            showSettings();
          }
        });
      }
    });
  });
}
```

### 3.5. نمط تسمية الصور — فك تشفير الإحداثيات

أسماء الصور تتبع نمطاً مُشفّراً يُخزّن مواقع الاختلافات:

```
-0z20x43z51y27z54x29z94y23z35x67z27y13z97x5z59y56z29x19z16
```

**التفسير:**
- الحرف الأول (`-`) = إشارة البداية (ربما صورة أساسية).
- كل مقطع بين `z` يمثل زوج إحداثيات بنمط `<num>x<num>y` أو `<num>x` أو `y<num>`.
- هذه الإحداثيات (5 إلى 10 أزواج عادة) هي مواقع دوائر الاختلافات على الصورة.

**مثال محلول للصورة الأولى:**

```
-0 → 0 (نقطة بداية؟)
z20x43 → نقطة عند (x=20, y=43)؟
z51y27 → نقطة عند (x=51, y=27)؟
z54x29 → نقطة عند (x=54, y=29)؟
...
```

> هذا النمط يسمح للعبة بمعرفة مواقع الاختلافات دون استخدام ملف JSON إضافي — كل ما تحتاجه موجود في اسم الملف نفسه.

---

## 4. إحصائيات البيانات المستخرجة

| المصفوفة | العدد | الوصف |
|----------|------|------|
| `photoArray` | 1,499 | الصور الأساسية للعبة |
| `vmiscArray` | 4,841 | صور misc (الأكبر!) |
| `vsceneArray` | 525 | صور scenes |
| `vphotoArray` | 98 | صور variant photos |
| `photo3Array` | 23 | نوع photo3 |
| `vector3Array` | 19 | نوع vector3 |
| **المجموع** | **7,005** | صور متاحة للعبة |

كل الصور موجودة على المسار:
```
https://www.flashi.me/img/diff/imagesD/{photo|vmisc|vscenes|vphoto|photo3|vector3}/
```

مثال: `https://www.flashi.me/img/diff/imagesD/photo/-0z20x43z51y27z54z...png`

---

## 5. الأصول المتاحة للتحميل

جميع الأصول التالية تم التحقق من وصولها (HTTP 200):

| الأصل | الرابط | الحجم |
|------|--------|------|
| السورس الرئيسي | `/flashi-js/diff.js` | 49.7 KB |
| خلفية اللعبة | `/img/diff/background.png` | 933 KB |
| شعار الحقوق | `/img/diff/rights/f10.png` | 19 KB |
| أيقونة الموقع | `/img/home/favicon1.png` | 5 KB |
| خط Bukra | `/fonts/29ltbukrabold.otf` | 178 KB |
| خط AlHurra | `/fonts/AlHurraFontBold.ttf` | 52 KB |
| صور اللعبة | `/img/diff/imagesD/<category>/<filename>.png` | متغير |

**لوحة مفاتيح تحميل صور متعددة:**
```bash
# تحميل أول 50 صورة من photoArray
jq -r '.[].basename' photoArray.json | head -50 | while read name; do
  curl -sSL -o "images/$name" "https://www.flashi.me/img/diff/imagesD/photo/$name"
done
```

---

## 6. القيود والملاحظات

1. **التشفير (Obfuscation)**: ملف `diff.js` مُشوَّه بأداة JavaScript Obfuscator احترافية. فك التشفير الكامل يتطلب أدوات مثل `webcrack`, `javascript-deobfuscator`, أو `obfuscator-io-deobfuscator`.

2. **Firebase Configuration**: جميع مفاتيح Firebase (apiKey, appId, projectId, ...) مشفّرة بجدول lookup (`_0x5982f3`). لإظهارها، يحتاج المرء إلى تنفيذ دالة `_0x2406(0x1d5)` في بيئة JavaScript (Node.js أو متصفح).

3. **كلمة المرور**: غير متاحة في السورس نهائياً. تخزَّن في Firebase Authentication (وليس Firestore)، ولا يمكن استخراجها مهما حصلت على السورس.

4. **منطق اللعبة**: الملف الكامل لمنطق اللعبة (`diff.js`) متاح بحجم 49.7 KB، لكنه مُشوَّه بالكامل. يمكن استخدام أدوات فك التشفير المذكورة أعلاه للحصول على كود نظيف نسبياً.

5. **حقوق النشر**: اللعبة ومحتواها مملوكة لـ flashi.me. استخدم السورس لأغراض التعلم والدراسة فقط. لا تُعِد نشر اللعبة أو الصور دون إذن.

---

## 7. كيف تستخدم السورس المستخرَج؟

### للأغراض التعليمية:
1. اقرأ `analysis_summary.json` لفهم بنية الصفحة.
2. افتح `external_diff.js` لدراسة بنية دوال اللعبة (37 دالة).
3. افتح `data_arrays/photoArray.json` لرؤية بنية بيانات الصور.
4. اقرأ `inline_scripts/inline_02_trailing_logic.js` لرؤية إعداد Firebase.

### لتنفيذ السورس محلياً (تصحيح/تعلم):
```bash
# 1. فك تشفير diff.js باستخدام webcrack
npx webcrack external_diff.js -o external_diff.deobf.js

# 2. أو باستخدام javascript-deobfuscator
npx js-deobfuscator external_diff.js
```

### لاستخراج Firebase config:
```javascript
// في Node.js (بعد تثبيت firebase)
// انسخ `_0x5982f3` و `_0x2406` ثم نفّذ:
// console.log(_0x434336(0x1d5)) → apiKey
// console.log(_0x434336(0x1e6)) → authDomain
// ... إلخ
```

---

## 8. ملاحظات حول أداة REA المذكورة

ذكرتُ سابقاً أن **REA (Reverse Engineer Anything)** تحتاج إلى:
- Node.js 22.x+ على جهازك المحلي
- إعداد عبر `npx rea-agents setup` (MCP)
- اتصال بـ MCP client (Claude Desktop / Cursor / إلخ)

**ما قمت به هنا يحقق نفس الهدف** دون الحاجة لتثبيت REA محلياً:
1. ✅ استخراج السورس الخام (HTML/CSS/JS).
2. ✅ فصل الملفات الخارجية والداخلية.
3. ✅ فك بنية الـ obfuscation (جدول lookup + دوال فك التشفير).
4. ✅ استخراج جميع مصفوفات البيانات.
5. ✅ تحليل معماري للدوال والبنية.

إذا رغبت في استكمال فك تشفير `diff.js` بالكامل (إظهار النصوص من جدول `_0x5982f3`)، يمكنني ذلك بتنفيذ دالة فك التشفير في Node.js — فقط قُل لي وسأقوم بذلك.

# توثيق يلا لودو — المستخرج من APK v1.3.1.0

> المصدر: تفكيك `Yalla+Ludo_1.3.1.0_.apk` — كل ما يلي مستخرج حرفياً من الملفات الداخلية.
> المرجع الكامل منسوخ في `reference/yalla-ludo/` و `reference/yalla-chat/`.

## 1) الخوادم الحقيقية (من classes3.dex)

| الخدمة | العنوان |
|---|---|
| **سوكت اللعبة (إنتاج)** | `wss://dtslave.yalla.games/comet` |
| سوكت (تطوير) | `wss://dev-dtslave.yalla.games:7402/comet` |
| سوكت (اختبار داخلي) | `wss://fat-dtslave.yalla.games:7402/comet` |
| API رئيسي | `api.yalla.games` (+ apitest / apidev) |
| activity / كوبونات | `activity.yalla.games` (+ fat-activity) |
| ملفات وسكنات اللعبة | `file.yallaludo.com` / `file.yalla.games` |
| سكنات H5 | `https://file.yallaludo.com/Skin/H5/ludoCache11905/` |
| حساب | `account.yalla.games` (+ أيقونات الجنسيات `NationlityIcon/N.png`) |
| غرف | `roomapi.yalla.games`, `roomwb`, `roomsearch`, `roommoment`, `roomclog` |
| دردشة | `dtchat.yalla.games`, `clog.yalla.games` |
| متجر | `shop.yalla.games` |
| هول | `halldev.yalla.games/ludo_domino/index.html` |
| صوت | Agora (أساسي) أو Zego — توكن يُطلب من السيرفر (GET_AGORA_TOKEN=90) |

## 2) البروتوكول الحقيقي للعبة (Protobuf)

الملف الكامل: `docs/yalla-ludo-protocol.proto` (منسوخ من cache: `a7d642bd`).
هذه أهم ما فيه:

### الأوامر (Command enum)
```
LOGIN=10  TICKET_LOGIN=11  QUICKSTART=20  QUIT_ROOM=21  JOIN_ROOM=22
GAMEOPERATE=30  GAME_PRESTART=39  GAMESTATUS=40  GAME_PLAYER_COLOR_SELECT=41
GAME_MAP_WHETHER_CHANGE=42  GAME_MAP_GRID_EVENT=43  GAME_BUFF_USE=44
GAME_CHESS_CANMOVELIST=45  GAME_MAP_CHESS_MOVE=46  GAMERESULT=49
GAMEPLAYERSTATUS=50  GAME_PLAYER_COMPLETE=51  PLAYER_ENTER=60  PLAYER_CHAT_ALL=70
UPDATA_PLAYER_COIN=80  UPDATA_PLAYER_LEVEL=81  FLUSH_CURRENCY=82  FLUSH_GAMEINFO=83
GET_AGORA_TOKEN=90  AGORA_OPERATE=91  GET_ZEGO_TOKEN=92
FRIEND_ADD_MSG=100  FRIEND_LIST=101  FRIEND_INVITE=102  PLAYER_REPORT=110
GAME_GIFT_CNF_LIST=111  GAME_GIFT_SEND=112  GOODS_LIST=120  OUT_GAME=126  HEART=127
```

### عمليات اللاعب (GameOperate enum)
```
SIT=0  UP=1  SIGN_UP=2 (استعداد)  SIGN_CANCEL=3  THROW=4 (رمي النرد)
RESET_THROW=5 (إعادة رمي مدفوعة)  CHOOSE_CHESS=6 (اختيار قطعة)  CHESS_MOVE=7
SYSTEM_TRUST=8 (توكيل النظام)  SYSTEM_TRUST_CANCEL=9  RESET_THROW_FREE=10
CHAT_OFF=11  CHAT_OFF_CANCEL=12
```

### حالات الدور (PlayerTurnStatus)
```
THROW_START=0  THROW_END=1  RETHROW_START=2  RETHROW_END=3
CHOOSECHESS_START=4  CHOOSECHESS_END=5  CHESSMOVE_START=6  CHESSMOVE_END=7
```

### منطق مميز في يلا لودو (مهم للمحاكاة)
- **إعادة رمي النرد (RETHROW)**: اللاعب يدفع (reThrowCost=2 مجوهرات افتراضياً) لإعادة رمي النرد — maxReThrowNum محدود من الغرفة.
- **الألوان**: RED=0, YELLOW=1, BLUE=2, GREEN=3, ORANGE=4 (خمسة ألوان! والقطع التيجان في نسختنا 4).
- **叠子 (Stacking)**: قطع فوق بعض (chessLinkId) — تصبح درع لا تُأكل.
- **الطقس (Weather)**: SUN=0, WIND=1 (إعصار يحرك القطع), RAINBOW=2 (جسر قوس قزح), THUNDERSTORM=3.
- **القوى (Prop/Buff)**: درع SHIELD، نرد مزدوج DOUBLLE_DICE، نرد حظ LUCK_DICE، صاعقة SWOON، صاروخ ROCKET، شعلة FLARE.
- **الأنواع**: ROOM GROUP: SPORTS_MODE=0 (تنافسي) / PROP_MODE=1 (أدوات). ROOM TYPE: NORMAL=0, MASTER=1, QUICK=2, FIRE=3.
- **أحداث الخلية (ChessEvent)**: Fight (أكل), Win (وصول), GetLink (تكديس), TRANSLOCATION, GET_BUFF...
- **هدايا تفاعلية داخل اللعبة** (v1.3.1): GameGiftCnf { id, icon, money, diamond, sort, type: EMOJ } مع تبريد (limitCount/coolDownTime).
- **التسلسل**: قطعة تكمل (GAME_PLAYER_COMPLETE) — الترتيب 1..4 مع winIndex.
- **اقتصاد اللعبة**: money=coins, gold=diamonds (انتبه: مقلوبة عن مشروعنا!), exp/level, vipExp/vipLevel, segId (رتبة), starNum (نجمة أسطورية).

### نموذج اللاعب الحقيقي (PlayerShowInfo)
```
sitNum, isSignUp, winIndex, isLeft, isFighted, diceNum[], buff[],
isInSysTrust, reThrowNum, reThrowCost, diceSkinId, talkSkinId(فقاعة كلام),
chessSkinId, segId(رتبة), starNum, prettyId(معرف جميل), roylevel(مستوى ملكي), giftId
```

## 3) كود اللعبة (محرك LayaAir)

- `assets/scripts/index.js` — محمّل LayaBox.
- `assets/game/1.3.1.02.zip` (9MB) → يحتوي cache لـ `stand.alone.version`:
  - `cdf04339` (3.8MB) = محرك LayaAir كامل JS (منسوخ/mangled) — فيه MD5, protobuf.js داخلياً.
  - بقية الملفات: لقطات UI ({"type":"View"}), أطلس PNG, DragonBones أنيميشنات, ترجمات (عربي/أردو), بروتو, إعدادات سكن.
  - **منطق الخادم غير موجود** — العميل يرسل عمليات ويرد السيرفر (المحرك authoritative).
- `assets/ylgame/` — صفحات قواعد HTML داخلية (ludoVipRoom, royalLevel, battlePass, league, legendStar, team, friends, medal, uniqueStore, terminalBox...) — سلوكيات الميزات موصوفة نصياً.
- `assets/ylacenter/` — مركز الحساب (Vue app) مع Defaultavatar.jpg رابط.

## 4) الهدايا — الحقيقة الكاملة

- **لا توجد رسوم هدايا داخل APK نهائياً** — 135 ملف SVGA كلها واجهة (تحميل، دخول غرفة، إطارات، مستويات، VIP).
- الهدايا في يلا تُجلب وقت التشغيل من CDN (`file.yallaludo.com`) حسب كتالوج السيرفر (GAME_GIFT_CNF_LIST داخل اللعبة / API للغرف).
- **SVGA = صيغة أنيميشن (zip فيه JSON + PNGs)** — يمكن تشغيلها بالويب عبر مكتبة `svgaplayerweb` (تحتاج تثبيت، ممنوع في هذه الجلسة).
- البديل المطبق: رسوم SVG يدوية لكل هدية + أنيميشن CSS (موجود فعلاً في gifts.js).

## 5) جرد الأصول المستخدمة في الواجهة (client/assets/)

من `res/drawable-xxhdpi-v4` و `res/mipmap-xxhdpi-v4`:
- قطع اللودو الأصلية: piece_red/green/bule/yellow.png (93x93، تاج داخل قطعة دائرية).
- النرد الذهبي: gold_dice.png (77x80).
- العملات: coin_big, base_icon_coin_s (ذهب ذهبي مسنن), diamonds/diamond_big/base_icon_crystal (مجوهرات).
- شارات المستوى: level_1_9_ic ... level_50_60_ic (درع ملون).
- شعار: logo_icon.png (أيقونة يلا لودو الرسمية), logo_ludo.png, ludo_title.png.
- مايك: room_mic, room_ic_input_mic(_off).
- خلفيات: bg_hall.png (1125x1995), bg_top_hall.png.
- بانرات: banner_freecoin.png, sign_7_entrance_ic.png (تسجيل دخول 7 أيام).

## 6) ترجمات عربية أصلية

`b5602bc5` = ملف ترجمة عربي كامل للعبة (Tip, BACK, SHARE, "Play Again"=العب مرة أخرى...).
`72091bc9` = أردو. يمكن استخدام النصوص العربية الأصلية في واجهتنا.

## 7) نسخة YallaChat (v1.5.0)

- 266 رسمة فقط في res — لا هدايا ولا أفاتارات مفيدة.
- نفس بنية الخوادم (yalla.games) — دردشة أساساً.

## 8) ما لا يمكن استخراجه (قيود فعلية)

1. منطق الخادم (أوزان النرد، المعادلات) — على سيرفرات يلا، غير موجود في APK.
2. رسوم الهدايا — على CDN، تُحمّل ديناميكياً.
3. SVGA player — يحتاج تثبيت مكتبة (ممنوع في هذه الجلسة؛ يمكن للمستخدم `npm i svgaplayerweb`).
4. مفاتيح Agora/Zego — تُدار عبر توكن سيرفري، لا توجد ثابتة في APK.

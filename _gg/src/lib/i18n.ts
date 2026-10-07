// ============================================================
// INTERNATIONALIZATION - Arabic & English Translations
// ============================================================

export type Lang = 'ar' | 'en';

export interface Translations {
  // === General ===
  gameTitle: string;
  loading: string;
  startGame: string;
  playAgain: string;
  reset: string;
  resetConfirm: string;
  yes: string;
  no: string;
  confirm: string;
  cancel: string;
  skip: string;
  next: string;
  nextPlayer: string;
  round: string;

  // === Setup ===
  playerCount: string;
  playerNames: string;
  playerName: string;
  showRules: string;
  hideRules: string;
  rules: string;
  emptyNameError: string;
  duplicateNameError: string;
  mafiaTeam: string;
  citizenTeam: string;
  plainCitizen: string;
  mafiaWin: string;
  mafiaWinDesc: string;
  citizenWin: string;
  citizenWinDesc: string;

  // === Roles ===
  mafiaBoss: string;
  mafiaBossDesc: string;
  mafiaSilencer: string;
  mafiaSilencerDesc: string;
  mafiaRegular: string;
  mafiaRegularDesc: string;
  mayor: string;
  mayorDesc: string;
  goodSon: string;
  goodSonDesc: string;
  medic: string;
  medicDesc: string;
  sniper: string;
  sniperDesc: string;
  citizen: string;
  citizenDesc: string;

  // === Game Phases ===
  phaseSetup: string;
  phaseCardDist: string;
  phaseNightStart: string;
  phaseMafiaWake: string;
  phaseBossKill: string;
  phaseSilencer: string;
  phaseMafiaSleep: string;
  phaseMedic: string;
  phaseSniper: string;
  phaseNightEnd: string;
  phaseAnnouncements: string;
  phaseMayorReveal: string;
  phaseDiscussion: string;
  phaseVoting: string;
  phaseElimination: string;
  phaseRevenge: string;
  phaseGameOver: string;

  // === Night Phase ===
  nightStartTitle: string;
  nightStartDesc: string;
  mafiaWakeDesc: string;
  passDeviceTo: string;
  yourTeammates: string;
  bossKillDesc: string;
  chooseVictim: string;
  target: string;
  silencerDesc: string;
  chooseSilence: string;
  silenced: string;
  mafiaSleepDesc: string;
  medicDesc: string;
  guessWhoWillDie: string;
  save: string;
  sniperDesc: string;
  holdBullet: string;
  fireBullet: string;
  chooseTarget: string;
  bulletSaved: string;
  nightEndDesc: string;

  // === Day Phase ===
  day: string;
  night: string;
  nightEvents: string;
  seeWhatHappened: string;
  medicSaved: string;
  noOneDied: string;
  quietNight: string;
  killedByMafia: string;
  assassinatedBy: string;
  sniperKilled: string;
  sniperMissed: string;
  wasMafia: string;
  greatShot: string;
  sniperDied: string;
  silencedThisRound: string;
  continue: string;

  // === Mayor Reveal ===
  mayorRevealTitle: string;
  mayorRevealDesc: string;
  revealCard: string;
  voteWeight: string;
  staySecret: string;

  // === Discussion ===
  discussionTitle: string;
  discussionDesc: string;
  startTimer: string;
  skipToVoting: string;
  goToVoting: string;
  mayorRevealed: string;
  revealedMayorVotes: string;

  // === Voting ===
  votingTitle: string;
  votingDesc: string;
  anyoneWantsToChange: string;
  clickToChange: string;
  silencedCantVote: string;
  areSilenced: string;
  liveResults: string;
  remainingPlayers: string;
  completed: string;
  inProgress: string;
  finalizeVoting: string;
  chooseWhoToEliminate: string;
  voted: string;
  voteWeightBadge: string;
  voteChange: string;
  changeVote: string;
  cancelVote: string;
  voteConfirm: string;

  // === Elimination ===
  eliminated: string;
  tieVote: string;
  noOneEliminated: string;
  voteResults: string;

  // === Good Son Revenge ===
  goodSonTitle: string;
  goodSonDesc: string;
  takeWithMe: string;

  // === Game Over ===
  citizensWin: string;
  mafiaWins: string;
  survivors: string;
  eliminated: string;
  rounds: string;
  revealAllCards: string;
  gameLog: string;
  player: string;

  // === Footer / Presenter ===
  presenterLabel: string;
  presenterCommentary: Record<string, string>;
  branding: string;
  adminMode: string;
  hideRoles: string;
  admin: string;

  // === Game Logic ===
  mafiaCount: string;
  citizenCount: string;
  player: string;

  // === Card Distribution ===
  iAmPlayer: string;
  tapToSeeCard: string;
  seeMyCard: string;
  yourMafiaTeammates: string;
  allSawCards: string;
  iSawMyCard: string;

  // === Role Card ===
  mafiaTeamLabel: string;
  citizenTeamLabel: string;
  passDeviceNext: string;

  // === Abbreviations ===
  minutesAbbr: string;
  secondsAbbr: string;
  votesWord: string;

  // === Lobby ===
  lobbySubtitle: string;
  godfatherMode: string;
  godfatherDesc: string;
  narratorLabel: string;
  diwaniyaLobbyDesc: string;
  diwaniyaLobbyInfo: string;
  createGame: string;
  createGameDesc: string;
  joinGame: string;
  joinGameDesc: string;
  enterRoomCode: string;
  featurePlayers: string;
  featureDiwaniya: string;
  featureRoles: string;

  // === Diwaniya Mode ===
  diwaniyaMode: string;
  diwaniyaDesc: string;
  createRoom: string;
  roomCode: string;
  shareLink: string;
  copyLink: string;
  copied: string;
  copiedCode: string;
  joinRoom: string;
  enterYourName: string;
  waitingForHost: string;
  yourRole: string;
  playersJoined: string;
  diwaniyaActive: string;
  scanOrOpen: string;
  roomCreated: string;
  roomLinkCopied: string;
  waitingPlayers: string;
  tapToReveal: string;
  keepSecret: string;
  roomNotFound: string;
  playerNameRequired: string;
  playerAlreadyJoined: string;
  roomFull: string;
  gameAlreadyStarted: string;
  waitingForRoles: string;
  roleRevealed: string;
  showRoomInfo: string;
  hideRoomInfo: string;

  // === Waiting Room (Diwaniya Host) ===
  waitingRoom: string;
  approvePlayer: string;
  rejectPlayer: string;
  kickPlayer: string;
  approveAll: string;
  pendingApproval: string;
  approvedPlayers: string;
  pendingPlayers: string;
  waitingForMore: string;
  readyToStart: string;
  playerWaiting: string;
  playerApproved: string;
  cannotStartYet: string;
  refreshList: string;
  hostLeftTitle: string;
  hostLeftDesc: string;
  leaveRoom: string;
  leaveRoomConfirm: string;
  selectPlayerCount: string;
  hostLabel: string;
  approvedWaitingStart: string;
  approvedWaitingDesc: string;
  pendingApprovalDesc: string;
  kickedFromRoom: string;
  kickedFromRoomDesc: string;

  // === Game Log Messages ===
  logGameStarted: string;
  logSilenced: string;
  logMedicSaved: string;
  logBossKilled: string;
  logSniperKilledMafia: string;
  logSniperMissed: string;
  logTieVote: string;
  logEliminatedByVote: string;
  logGoodSonRevenge: string;
}

const ar: Translations = {
  gameTitle: 'لعبة المافيا',
  loading: 'جاري تحضير اللعبة...',
  startGame: 'ابدأ اللعبة 🔥',
  playAgain: 'العب مرة أخرى',
  reset: 'إعادة',
  resetConfirm: 'متأكد؟',
  yes: 'نعم',
  no: 'لا',
  confirm: 'تأكيد الصوت',
  cancel: 'تخطي',
  skip: 'تخطي',
  next: 'التالي',
  nextPlayer: 'اللاعب التالي',
  round: 'الجولة',

  playerCount: 'عدد اللاعبين',
  playerNames: 'أسماء اللاعبين',
  playerName: 'اسم اللاعب',
  showRules: 'عرض القوانين',
  hideRules: 'إخفاء القوانين',
  rules: '📜 القوانين',
  emptyNameError: 'يجب إدخال أسماء جميع اللاعبين',
  duplicateNameError: 'يجب أن تكون الأسماء مختلفة',
  mafiaTeam: 'فريق المافيا',
  citizenTeam: 'فريق الصالحين',
  plainCitizen: 'مواطن عادي',
  mafiaWin: '💀 المافيا تفوز بتبقية',
  mafiaWinDesc: 'مواطنين أو أقل',
  citizenWin: '🏆 الصالحون يفوزون بإقصاء كل المافيا',
  citizenWinDesc: '',

  mafiaBoss: 'شيخ المافيا',
  mafiaBossDesc: 'كل ليلة، تختار شخصاً لاغتياله',
  mafiaSilencer: 'مافيا التسكيت',
  mafiaSilencerDesc: 'كل ليلة، تختار شخصاً لا يستطيع التحدث في الجولة التالية',
  mafiaRegular: 'مافيا عادي',
  mafiaRegularDesc: 'لا تملك قدرة خاصة، تشارك في قرارات المافيا',
  mayor: 'عمده الصالحين',
  mayorDesc: 'يمكنك كشف بطاقتك أثناء النهار بدون إقصاء. صوتك يساوي ٣ أصوات بعد الكشف',
  goodSon: 'الولد الصالح',
  goodSonDesc: 'عند إقصائك، يمكنك إخراج أي شخص معك (مواطن أو مافيا)',
  medic: 'الطبيب',
  medicDesc: 'كل ليلة، تخمّن من قتله شيخ المافيا لإنقاذه',
  sniper: 'قناص الصالحين',
  sniperDesc: 'لديك رصاصة واحدة فقط طوال اللعبة. إذا قتلت مواطناً، تموت أنت أيضاً',
  citizen: 'مواطن صالح',
  citizenDesc: 'لا تملك قدرة خاصة. صوّت بحكمة!',

  phaseSetup: '🔧 الإعداد',
  phaseCardDist: '🃏 توزيع البطاقات',
  phaseNightStart: '🌙 التغميضة',
  phaseMafiaWake: '👾 المافيا تستيقظ',
  phaseBossKill: '🔪 شيخ المافيا',
  phaseSilencer: '🤫 التسكيت',
  phaseMafiaSleep: '😴 المافيا تنام',
  phaseMedic: '🏥 الطبيب',
  phaseSniper: '🎯 القناص',
  phaseNightEnd: '🌅 انتهت الليل',
  phaseAnnouncements: '📢 أحداث الليل',
  phaseMayorReveal: '🏛️ كشف العمده',
  phaseDiscussion: '💬 النقاش',
  phaseVoting: '🗳️ التصويت',
  phaseElimination: '⚔️ الإقصاء',
  phaseRevenge: '👦 انتقام الولد الصالح',
  phaseGameOver: '🏁 انتهت اللعبة',

  nightStartTitle: '🌙 التغميضة',
  nightStartDesc: 'أغمضوا أعينكم يا جماعة! الليلة رح تكون حامية! 🔥',
  mafiaWakeDesc: 'المافيا... افتحوا واعرفوا على بعض بالظلام! 👀',
  passDeviceTo: 'مرر الجهاز إلى:',
  yourTeammates: 'زميلائك:',
  bossKillDesc: 'اختر ضحيتك بحكمة! دم أو ابتسامة! 🩸',
  chooseVictim: 'اختر ضحيتك:',
  target: 'الهدف:',
  silencerDesc: 'اختر من تريد تسكيته!',
  chooseSilence: 'اختر من تريد تسكته:',
  silenced: 'التسكيت:',
  mafiaSleepDesc: 'المافيا... ناموا حلوين! 😴',
  medicDesc: 'خمّن صح وانقذ حياة! أو تخطئ وتندم! 💊',
  guessWhoWillDie: 'من تعتقد أنه سيُقتل؟',
  save: 'إنقاذ:',
  sniperDesc: 'رصاصة واحدة! إما تقتل المافيا أو تموت معاه! 🔫',
  holdBullet: 'أمسك الرصاصة 🤲',
  fireBullet: 'أطلق الرصاصة 🔫',
  chooseTarget: 'اختر هدفك:',
  bulletSaved: 'الرصاصة محفوظة للجولات القادمة',
  nightEndDesc: 'افتحوا أعينكم...',

  day: '☀️ النهار',
  night: '🌙 الليل',
  nightEvents: '☀️ أحداث الليل',
  seeWhatHappened: 'شوفوا شو صار!',
  medicSaved: 'أنقذ الطبيب شخصاً الليلة!',
  noOneDied: 'لم يُقتل أحد',
  quietNight: '✅ ليلة هادئة! لم يُقتل أحد',
  killedByMafia: 'قُتل',
  assassinatedBy: 'اغتاله شيخ المافيا',
  sniperKilled: 'القناص قتل',
  sniperMissed: 'لكن القناص أخطأ ومات أيضاً!',
  wasMafia: 'كان مافيا! هدف ممتاز!',
  sniperDied: '❌ القناص مات أيضاً!',
  silencedThisRound: 'مسكوت هذه الجولة!',
  continue: 'المتابعة',

  mayorRevealTitle: 'هل يريد العمده كشف بطاقته؟ 🏛️',
  mayorRevealDesc: 'مرر الجهاز إلى العمده سراً ليقرر! إذا كشف بصوته بيساوي ٣ أصوات! خطوة جريئة!',
  revealCard: 'نعم، أكشف بطاقتي! (صوتي = ٣ أصوات)',
  voteWeight: '👑 صوتك يساوي ٣ أصوات! اختر بحكمة!',
  staySecret: 'لا، سأبقى سراً',

  discussionTitle: 'وقت النقاش - كل كلمة بتعدّ! 🔥',
  discussionDesc: 'وقت النقاش - كل كلمة بتعدّ! 🔥',
  startTimer: 'ابدأ المؤقت',
  skipToVoting: 'الانتقال إلى التصويت 🔥',
  goToVoting: 'الانتقال إلى التصويت 🔥',
  mayorRevealed: 'كشف بطاقته! صوته يساوي ٣ أصوات',
  revealedMayorVotes: '🏛️ العمده كشف بطاقته! صوته يساوي ٣ أصوات',

  votingTitle: 'التصويت 🔥',
  votingDesc: 'اضغط على اسم اللاعب ليصوّت - يمكن لأي لاعب تغيير صوته في أي وقت!',
  anyoneWantsToChange: 'حد بده يغير؟ اضغط على اسمك لتغيير صوتك',
  clickToChange: 'اضغط لتغيير الصوت',
  silencedCantVote: 'مسكوتون ولا يستطيعون التصويت',
  areSilenced: 'مسكوتون ولا يستطيعون التصويت',
  liveResults: 'نتائج التصويت المباشر',
  remainingPlayers: 'اللاعبون المتبقون',
  completed: '✅ اكتمل',
  inProgress: '⏳ جاري التصويت',
  finalizeVoting: 'إنهاء التصويت',
  chooseWhoToEliminate: 'اختر من تريد إقصاءه! 💀',
  voted: 'صوّت',
  voteWeightBadge: 'العمده = ٣ أصوات 👑',
  voteChange: 'تغيير التصويت',
  changeVote: 'تغيير',
  cancelVote: '🚫 إلغاء',
  voteConfirm: 'تأكيد الصوت',

  eliminated: 'تم إقصاء',
  tieVote: 'تعادل في الأصوات!',
  noOneEliminated: 'لم يتم إقصاء أحد هذه الجولة',
  voteResults: 'نتائج التصويت:',

  goodSonTitle: 'الولد الصالح يختار!',
  goodSonDesc: 'اختر شخصاً ليخرج معك من اللعبة',
  takeWithMe: 'أخرجه معي!',

  citizensWin: 'الصالحون فازوا! 🎉',
  mafiaWins: 'المافيا فازت! 😈',
  survivors: 'نجوا',
  eliminated: 'أُقصوا',
  rounds: 'جولات',
  revealAllCards: 'كشف جميع البطاقات',
  gameLog: '📜 سجل اللعبة',
  player: 'لاعب',

  presenterLabel: '🎙️ الغريب',
  presenterCommentary: {
    setup: '🔥 يا شباب، هادي اللعبة مش عادية... القوي بيعيش والضعيف بيموت! هل أنتم مستعدين للمغامرة؟ 🔥',
    card_distribution: '🕵️‍♂️ المافيا... إياكم تفتحوا عيونكم! المرة الجاية اللي بيفتح رح يكشف نفسه! 🕵️‍♂️',
    night_start: '🌙 أغمضوا أعينكم يا جماعة! مين اللي بيخاف من الظلام؟ الليلة رح تكون طويلة... 🌙',
    night_mafia_wake: '👾 المافيا... المافيا يفتحوا! افتحوا واختبوا بالظلام واتخابثوا على ضحيتكم! 👾',
    night_boss_kill: '🔪 شيخ المافيا... اختر بحكمة! صباحك بدم أو صباحك بابتسامة! 🔪',
    night_silencer: '🤫 مافيا التسكيت... وين بده يطنش؟ انطر وأنت صامت! 🤫',
    night_mafia_sleep: '😴 المافيا تنام... حلوين حلموا بصباح سعيد! 😴',
    night_medic: '🏥 الطبيب... وين بده يضحي؟ خمن صح وتنقذ حياة! أو تخطئ وتخسر كل شي! 🏥',
    night_sniper: '🎯 القناص... عندك رصاصة وحدة بس! لا تخطئ وإلا رح تموت معاه! 🎯',
    night_end: '🌅 افتحوا أعينكم يا جماعة! شوفوا إذا في دم هالليل أو لا! 🌅',
    day_announcements: '☀️ صباح الخير يا صالحين! أو مساء الخير... على حسب اللي صار بالليل! ☀️',
    day_mayor_reveal: '🏛️ العمده... هل بده يكشف نفسه؟ إذا كشف بصوته بيساوي ٣ أصوات! خطوة جريئة! 🏛️',
    day_discussion: '💬 وقت النقاش يا جماعة! كلموا وتكلموا واعرفوا وين المافيا! كل كلمة ممكن تكون سلاح! 💬',
    day_voting: '🗳️ حان وقت الحقيقة! صوّتوا بذكاء! حد بده يغير؟ الكل عنده فرصة يغير رأيه! 🗳️',
    day_elimination: '⚔️ تم الكشف! هل هو صالح ولا مافيا؟ شوفوا وين المصلحة! ⚔️',
    good_son_revenge: '👦 الولد الصالح ما بينموت لحاله! رح ياخد واحد معو للقبر! 👦',
    game_over: '🏁 انتهت اللعبة! من الفائز؟ المافيا ولا الصالحين؟ الجواب رح يصدمكم! 🏁',
  },
  branding: 'برمجة الغريب برعاية روم ANA VIP | ID:343434',
  adminMode: '👁️ وضع المدير',
  hideRoles: 'إخفاء',
  admin: 'المدير',

  mafiaCount: 'مافيا',
  citizenCount: 'مواطن صالح',
  player: 'لاعب',

  iAmPlayer: 'أنا {name}',
  tapToSeeCard: 'اضغط لرؤية بطاقتك - لا يراك أحد!',
  seeMyCard: 'أرى بطاقتي',
  yourMafiaTeammates: '🔴 زميلائك في المافيا:',
  allSawCards: 'جميع اللاعبين رأوا بطاقاتهم ✅',
  iSawMyCard: 'رأيت كرتي - التالي',

  mafiaTeamLabel: '🃏 فريق المافيا',
  citizenTeamLabel: '🛡️ فريق المواطنين',
  passDeviceNext: 'مرر الجهاز للاعب التالي',

  minutesAbbr: 'د',
  secondsAbbr: 'ث',
  votesWord: 'أصوات',

  lobbySubtitle: 'افتح غرفة او انضم لغرفة موجودة والعب مع اصحابك',
  godfatherMode: 'العراب',
  godfatherDesc: 'الغريب يدخل الأسامي ويشرف على اللعبة كاملة',
  narratorLabel: 'راوي',
  diwaniyaLobbyDesc: 'كل لاعب يرى دوره على جهازه الخاص',
  diwaniyaLobbyInfo: 'انضم للغرفة بكود الغرفة لترى دورك بشكل خاص',
  createGame: 'إنشاء لعبة جديدة',
  createGameDesc: 'ابدأ لعبة كاملة وكن أنت الهوست',
  joinGame: 'انضمام للعبة',
  joinGameDesc: 'أدخل رمز الغرفة للانضمام',
  enterRoomCode: 'أدخل رمز الغرفة',
  featurePlayers: '6-20 لاعب',
  featureDiwaniya: 'وضع الديوانية',
  featureRoles: '8 أدوار فريدة',

  diwaniyaMode: '🎮 وضع الديوانية',
  diwaniyaDesc: 'كل لاعب يرى دوره على جهازه الخاص',
  createRoom: 'إنشاء غرفة',
  roomCode: 'رمز الغرفة',
  shareLink: 'رابط المشاركة',
  copyLink: 'نسخ الرابط',
  copied: 'تم النسخ!',
  copiedCode: 'تم نسخ الكود!',
  joinRoom: 'انضمام للغرفة',
  enterYourName: 'أدخل اسمك',
  waitingForHost: 'في انتظار الهوست لبدء اللعبة...',
  yourRole: 'دورك',
  playersJoined: 'اللاعبون المنضمون',
  diwaniyaActive: 'الديوانية فعّالة',
  scanOrOpen: 'امسح الرمز أو افتح الرابط على جهازك',
  roomCreated: 'تم إنشاء الغرفة!',
  roomLinkCopied: 'تم نسخ رابط الغرفة!',
  waitingPlayers: 'بانتظار اللاعبين...',
  tapToReveal: 'اضغط لكشف دورك',
  keepSecret: 'لا تُظهر دورك لأحد!',
  roomNotFound: 'الغرفة غير موجودة',
  playerNameRequired: 'يجب إدخال اسمك',
  playerAlreadyJoined: 'هذا الاسم موجود بالفعل في الغرفة',
  roomFull: 'الغرفة ممتلئة',
  gameAlreadyStarted: 'اللعبة بدأت بالفعل',
  waitingForRoles: 'في انتظار توزيع الأدوار...',
  roleRevealed: 'تم كشف دورك!',
  showRoomInfo: 'عرض معلومات الغرفة',
  hideRoomInfo: 'إخفاء معلومات الغرفة',
  waitingRoom: 'غرفة الانتظار',
  approvePlayer: 'قبول',
  rejectPlayer: 'رفض',
  kickPlayer: 'طرد',
  approveAll: 'قبول الكل',
  pendingApproval: 'بانتظار الموافقة',
  approvedPlayers: 'تم قبولهم',
  pendingPlayers: 'بانتظار القبول',
  waitingForMore: 'بانتظار المزيد من اللاعبين...',
  readyToStart: 'جاهز لبدء اللعبة!',
  playerWaiting: 'منتظر',
  playerApproved: 'مقبول ✅',
  cannotStartYet: 'لا يمكن البدء - عدد المقبولين غير كافٍ',
  refreshList: 'تحديث القائمة',
  hostLeftTitle: 'غادر المستضيف',
  hostLeftDesc: 'لقد غادر المستضيف من الطاولة. يرجى إنشاء طاولة جديدة أو الانضمام إلى طاولة أخرى.',
  leaveRoom: 'مغادرة الغرفة',
  leaveRoomConfirm: 'متأكد من مغادرة الغرفة؟ سيتم إعلام اللاعبين.',
  selectPlayerCount: 'اختر عدد اللاعبين',
  hostLabel: 'المستضيف',
  approvedWaitingStart: 'تم قبولك! ✅',
  approvedWaitingDesc: 'المستضيف وافق على انضمامك. بانتظار بدء اللعبة...',
  pendingApprovalDesc: 'في انتظار موافقة المستضيف على انضمامك...',
  kickedFromRoom: 'تم طردك من الغرفة',
  kickedFromRoomDesc: 'المستضيف قام برفض انضمامك أو طردك من الغرفة.',

  logGameStarted: 'بدأت اللعبة!',
  logSilenced: 'تم تسكيت {name}',
  logMedicSaved: 'أنقذ الطبيب {name}',
  logBossKilled: 'قتل شيخ المافيا {name}',
  logSniperKilledMafia: 'القناص قتل {name} (مافيا!)',
  logSniperMissed: 'القناص أخطأ وقتل {name} (مواطن!) ومات أيضاً',
  logTieVote: 'تعادل في الأصوات! لم يتم إقصاء أحد',
  logEliminatedByVote: 'تم إقصاء {name} بالتصويت ({count} أصوات)',
  logGoodSonRevenge: 'الولد الصالح أخرج {name} معه!',
};

const en: Translations = {
  gameTitle: 'Mafia Game',
  loading: 'Preparing the game...',
  startGame: 'Start Game 🔥',
  playAgain: 'Play Again',
  reset: 'Reset',
  resetConfirm: 'Are you sure?',
  yes: 'Yes',
  no: 'No',
  confirm: 'Confirm Vote',
  cancel: 'Skip',
  skip: 'Skip',
  next: 'Next',
  nextPlayer: 'Next Player',
  round: 'Round',

  playerCount: 'Players',
  playerNames: 'Player Names',
  playerName: 'Player name',
  showRules: 'Show Rules',
  hideRules: 'Hide Rules',
  rules: '📜 Rules',
  emptyNameError: 'All player names are required',
  duplicateNameError: 'Names must be unique',
  mafiaTeam: 'Mafia Team',
  citizenTeam: 'Citizens Team',
  plainCitizen: 'Plain Citizen',
  mafiaWin: '💀 Mafia wins with',
  mafiaWinDesc: 'citizens or less remaining',
  citizenWin: '🏆 Citizens win by eliminating all mafia',
  citizenWinDesc: '',

  mafiaBoss: 'Mafia Boss',
  mafiaBossDesc: 'Each night, choose someone to assassinate',
  mafiaSilencer: 'Silencer',
  mafiaSilencerDesc: 'Each night, choose someone who cannot speak the next round',
  mafiaRegular: 'Regular Mafia',
  mafiaRegularDesc: 'No special ability, participates in mafia decisions',
  mayor: 'Mayor',
  mayorDesc: 'Reveal your card safely during the day. Your vote counts as 3 after reveal',
  goodSon: 'Good Son',
  goodSonDesc: 'When eliminated, you can take someone with you (citizen or mafia)',
  medic: 'Medic',
  medicDesc: 'Each night, guess who the boss killed to save them',
  sniper: 'Sniper',
  sniperDesc: 'Only one bullet! If you kill a citizen, you die too',
  citizen: 'Citizen',
  citizenDesc: 'No special ability. Vote wisely!',

  phaseSetup: '🔧 Setup',
  phaseCardDist: '🃏 Card Distribution',
  phaseNightStart: '🌙 Night Start',
  phaseMafiaWake: '👾 Mafia Wakes Up',
  phaseBossKill: '🔪 Boss Kill',
  phaseSilencer: '🤫 Silencer',
  phaseMafiaSleep: '😴 Mafia Sleeps',
  phaseMedic: '🏥 Medic',
  phaseSniper: '🎯 Sniper',
  phaseNightEnd: '🌅 Night Ends',
  phaseAnnouncements: '📢 Night Events',
  phaseMayorReveal: '🏛️ Mayor Reveal',
  phaseDiscussion: '💬 Discussion',
  phaseVoting: '🗳️ Voting',
  phaseElimination: '⚔️ Elimination',
  phaseRevenge: '👦 Good Son Revenge',
  phaseGameOver: '🏁 Game Over',

  nightStartTitle: '🌙 Night Falls',
  nightStartDesc: 'Close your eyes everyone! Tonight will be intense! 🔥',
  mafiaWakeDesc: 'Mafia... Open your eyes and meet in the dark! 👀',
  passDeviceTo: 'Pass the device to:',
  yourTeammates: 'Your teammates:',
  bossKillDesc: 'Choose wisely! Blood or a smile? 🩸',
  chooseVictim: 'Choose your victim:',
  target: 'Target:',
  silencerDesc: 'Choose who to silence!',
  chooseSilence: 'Choose who to silence:',
  silenced: 'Silenced:',
  mafiaSleepDesc: 'Mafia... Sweet dreams! 😴',
  medicDesc: 'Guess right and save a life! Or guess wrong and regret! 💊',
  guessWhoWillDie: 'Who do you think will be killed?',
  save: 'Save:',
  sniperDesc: 'One bullet! Kill the mafia or die with them! 🔫',
  holdBullet: 'Hold Fire 🤲',
  fireBullet: 'Fire! 🔫',
  chooseTarget: 'Choose your target:',
  bulletSaved: 'Bullet saved for future rounds',
  nightEndDesc: 'Open your eyes...',

  day: '☀️ Day',
  night: '🌙 Night',
  nightEvents: '☀️ Night Events',
  seeWhatHappened: 'See what happened!',
  medicSaved: 'The Medic saved someone tonight!',
  noOneDied: 'No one was killed',
  quietNight: '✅ Quiet night! No one was killed',
  killedByMafia: 'was killed!',
  assassinatedBy: 'Assassinated by the Mafia Boss',
  sniperKilled: 'The Sniper killed',
  sniperMissed: 'But the Sniper missed and died too!',
  wasMafia: 'was mafia! Great shot!',
  sniperDied: '❌ The Sniper died too!',
  silencedThisRound: 'is silenced this round!',
  continue: 'Continue',

  mayorRevealTitle: 'Does the Mayor want to reveal? 🏛️',
  mayorRevealDesc: 'Pass the device to the Mayor secretly! If revealed, their vote counts as 3! A bold move!',
  revealCard: 'Yes, reveal my card! (Vote = 3)',
  voteWeight: '👑 Your vote counts as 3! Choose wisely!',
  staySecret: 'No, I\'ll stay secret',

  discussionTitle: 'Discussion Time - Every word counts! 🔥',
  discussionDesc: 'Discussion Time - Every word counts! 🔥',
  startTimer: 'Start Timer',
  skipToVoting: 'Skip to Voting 🔥',
  goToVoting: 'Go to Voting 🔥',
  mayorRevealed: 'revealed their card! Vote = 3',
  revealedMayorVotes: '🏛️ The Mayor revealed! Vote counts as 3',

  votingTitle: 'Voting 🔥',
  votingDesc: 'Tap a player to vote - anyone can change their vote anytime!',
  anyoneWantsToChange: 'Anyone wants to change? Tap your name to change vote',
  clickToChange: 'Tap to change vote',
  silencedCantVote: 'are silenced and cannot vote',
  areSilenced: 'are silenced and cannot vote',
  liveResults: 'Live Vote Results',
  remainingPlayers: 'Remaining Players',
  completed: '✅ Complete',
  inProgress: '⏳ Voting',
  finalizeVoting: 'Finalize Voting',
  chooseWhoToEliminate: 'Choose who to eliminate! 💀',
  voted: 'Voted',
  voteWeightBadge: 'Mayor = 3 votes 👑',
  voteChange: 'Vote changed',
  changeVote: 'Change',
  cancelVote: '🚫 Cancel',
  voteConfirm: 'Confirm Vote',

  eliminated: 'was eliminated!',
  tieVote: 'Tied votes!',
  noOneEliminated: 'No one was eliminated this round',
  voteResults: 'Vote Results:',

  goodSonTitle: 'Good Son\'s Choice!',
  goodSonDesc: 'Choose someone to take down with you',
  takeWithMe: 'Take them with me!',

  citizensWin: 'Citizens Win! 🎉',
  mafiaWins: 'Mafia Wins! 😈',
  survivors: 'Survived',
  eliminated: 'Eliminated',
  rounds: 'Rounds',
  revealAllCards: 'Reveal All Cards',
  gameLog: '📜 Game Log',
  player: 'player',

  presenterLabel: '🎙️ The Host',
  presenterCommentary: {
    setup: '🔥 Ladies and gentlemen, this is no ordinary game... The strong survive and the weak perish! Are you ready? 🔥',
    card_distribution: '🕵️‍♂️ Mafia... don\'t open your eyes! Whoever opens next reveals themselves! 🕵️‍♂️',
    night_start: '🌙 Close your eyes everyone! Who\'s afraid of the dark? Tonight will be long... 🌙',
    night_mafia_wake: '👾 Mafia... Mafia wake up! Open your eyes and conspire in the dark! 👾',
    night_boss_kill: '🔪 Boss... Choose wisely! Will it be blood or a smile? 🔪',
    night_silencer: '🤫 Silencer... Who shall be silenced? Be patient and silent! 🤫',
    night_mafia_sleep: '😴 Mafia sleep... Sweet dreams! 😴',
    night_medic: '🏥 Medic... Who will be sacrificed? Guess right to save a life! Or lose everything! 🏥',
    night_sniper: '🎯 Sniper... You have one bullet! Miss and you die with them! 🎯',
    night_end: '🌅 Open your eyes! See if there\'s blood tonight or not! 🌅',
    day_announcements: '☀️ Good morning citizens! Or should I say good evening... depending on what happened! ☀️',
    day_mayor_reveal: '🏛️ Mayor... Will you reveal yourself? If revealed, your vote counts as 3! A bold move! 🏛️',
    day_discussion: '💬 Discussion time! Talk and figure out who\'s mafia! Every word can be a weapon! 💬',
    day_voting: '🗳️ Time for truth! Vote wisely! Anyone wants to change? Everyone gets a chance! 🗳️',
    day_elimination: '⚔️ Revealed! Are they citizen or mafia? See what serves your interest! ⚔️',
    good_son_revenge: '👦 The Good Son doesn\'t die alone! They\'re taking someone to the grave! 👦',
    game_over: '🏁 Game Over! Who won? Mafia or Citizens? The answer will shock you! 🏁',
  },
  branding: 'Coded by Al-Ghareeb | Sponsored by ANA VIP Room | ID:343434',
  adminMode: '👁️ Admin Mode',
  hideRoles: 'Hide',
  admin: 'Admin',

  mafiaCount: 'Mafia',
  citizenCount: 'Citizens',
  player: 'Player',

  iAmPlayer: 'I am {name}',
  tapToSeeCard: 'Tap to see your card - no one is watching!',
  seeMyCard: 'See my card',
  yourMafiaTeammates: '🔴 Your mafia teammates:',
  allSawCards: 'All players saw their cards ✅',
  iSawMyCard: 'I saw my card - Next',

  mafiaTeamLabel: '🃏 Mafia Team',
  citizenTeamLabel: '🛡️ Citizens Team',
  passDeviceNext: 'Pass device to next player',

  minutesAbbr: 'm',
  secondsAbbr: 's',
  votesWord: 'votes',

  lobbySubtitle: 'Create a room or join an existing one and play with friends',
  godfatherMode: 'Godfather',
  godfatherDesc: 'The narrator enters names and controls the entire game',
  narratorLabel: 'Narrator',
  diwaniyaLobbyDesc: 'Each player sees their role on their own device',
  diwaniyaLobbyInfo: 'Join a room with the room code to see your role privately',
  createGame: 'Create New Game',
  createGameDesc: 'Start a full game as the host',
  joinGame: 'Join a Game',
  joinGameDesc: 'Enter room code to join',
  enterRoomCode: 'Enter room code',
  featurePlayers: '6-20 Players',
  featureDiwaniya: 'Diwaniya Mode',
  featureRoles: '8 Unique Roles',

  diwaniyaMode: '🎮 Diwaniya Mode',
  diwaniyaDesc: 'Each player sees their role on their own device',
  createRoom: 'Create Room',
  roomCode: 'Room Code',
  shareLink: 'Share Link',
  copyLink: 'Copy Link',
  copied: 'Copied!',
  copiedCode: 'Code Copied!',
  joinRoom: 'Join Room',
  enterYourName: 'Enter your name',
  waitingForHost: 'Waiting for host to start the game...',
  yourRole: 'Your Role',
  playersJoined: 'Players Joined',
  diwaniyaActive: 'Diwaniya Active',
  scanOrOpen: 'Scan QR or open link on your device',
  roomCreated: 'Room created!',
  roomLinkCopied: 'Room link copied!',
  waitingPlayers: 'Waiting for players...',
  tapToReveal: 'Tap to reveal your role',
  keepSecret: 'Don\'t show your role to anyone!',
  roomNotFound: 'Room not found',
  playerNameRequired: 'Please enter your name',
  playerAlreadyJoined: 'This name is already in the room',
  roomFull: 'Room is full',
  gameAlreadyStarted: 'Game already started',
  waitingForRoles: 'Waiting for role assignment...',
  roleRevealed: 'Your role has been revealed!',
  showRoomInfo: 'Show room info',
  hideRoomInfo: 'Hide room info',
  waitingRoom: 'Waiting Room',
  approvePlayer: 'Approve',
  rejectPlayer: 'Reject',
  kickPlayer: 'Kick',
  approveAll: 'Approve All',
  pendingApproval: 'Pending Approval',
  approvedPlayers: 'Approved',
  pendingPlayers: 'Pending',
  waitingForMore: 'Waiting for more players...',
  readyToStart: 'Ready to start!',
  playerWaiting: 'Waiting',
  playerApproved: 'Approved ✅',
  cannotStartYet: 'Cannot start - not enough approved players',
  refreshList: 'Refresh List',
  hostLeftTitle: 'Host Has Left',
  hostLeftDesc: 'The host has left the table. Please create a new table or join another one.',
  leaveRoom: 'Leave Room',
  leaveRoomConfirm: 'Are you sure you want to leave? Players will be notified.',
  selectPlayerCount: 'Select number of players',
  hostLabel: 'Host',
  approvedWaitingStart: 'You\'re Approved! ✅',
  approvedWaitingDesc: 'The host has approved you. Waiting for the game to start...',
  pendingApprovalDesc: 'Waiting for the host to approve your request...',
  kickedFromRoom: 'Removed from Room',
  kickedFromRoomDesc: 'The host has rejected or removed you from the room.',

  logGameStarted: 'Game started!',
  logSilenced: '{name} was silenced',
  logMedicSaved: 'Medic saved {name}',
  logBossKilled: 'Mafia Boss killed {name}',
  logSniperKilledMafia: 'Sniper killed {name} (Mafia!)',
  logSniperMissed: 'Sniper missed and killed {name} (Citizen!) and died too',
  logTieVote: 'Tied votes! No one was eliminated',
  logEliminatedByVote: '{name} was eliminated by vote ({count} votes)',
  logGoodSonRevenge: 'Good Son took {name} down with them!',
};

export const translations: Record<Lang, Translations> = { ar, en };

export function t(lang: Lang): Translations {
  return translations[lang];
}

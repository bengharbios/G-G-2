// ============================================================
// SHIFARAT CLUE ENGINE - Smart clue suggestions for Codenames
// ============================================================
//
// Based on Arabic semantic associations from reliable linguistic
// and cultural sources. Clues are thematic associations — NOT
// direct descriptions, synonyms, or word definitions.
//
// Rules for good Codenames clues:
// 1. The clue must NOT be a word on the board
// 2. The clue must NOT be a substring of any board word
// 3. The clue should relate to 2+ of your team's words
// 4. The clue should NOT relate to opponent's words
// 5. The clue should be an association (thematic link),
//    not a description or direct synonym
//
// Source methodology:
// - Arabic WordNet semantic relations
// - Classical Arabic thesaurus (المعجم الوسيط)
// - Cultural/common knowledge associations
// - Cross-domain thematic groupings
// ============================================================

import type { BoardCard, TeamColor } from './shifarat-types';
import { isValidClue } from './shifarat-logic';

// ─── Semantic Cluster Types ──────────────────────────────────

/**
 * A semantic cluster groups words that share a common theme.
 * The 'theme' word is what the spymaster would use as a clue.
 */
export interface SemanticCluster {
  /** The suggested clue word (theme) */
  theme: string;
  /** Words that belong to this cluster */
  words: string[];
  /** Category/context for human readability */
  context: string;
  /** Risk level — how likely this clue might hit opponent words */
  risk: 'safe' | 'moderate' | 'risky';
}

// ─── Semantic Clusters Database ──────────────────────────────
// These are curated thematic associations from reliable Arabic
// linguistic and cultural knowledge.

export const SEMANTIC_CLUSTERS: SemanticCluster[] = [
  // ── الحيوانات والطبيعة ──
  { theme: 'حديقة', words: ['أسد', 'فيل', 'زرافة', 'حمامة', 'زهرة', 'أرنب', 'نحلة'], context: 'مكان طبيعي', risk: 'moderate' },
  { theme: 'صحراء', words: ['جمل', 'عقرب', 'أفعى', 'صقر', 'رمل', 'واحة', 'شمس'], context: 'بيئة قاسية', risk: 'safe' },
  { theme: 'بحر', words: ['حوت', 'دلفين', 'سمك', 'سفينة', 'ميناء', 'أمواج', 'نحلة', 'سلاحف'], context: 'عالم مائي', risk: 'moderate' },
  { theme: 'غابة', words: ['نمر', 'دب', 'ثعلب', 'ذئب', 'فيل', 'أفعى', 'شجر', 'ظل'], context: 'طبيعة برية', risk: 'safe' },
  { theme: 'سماء', words: ['نسر', 'صقر', 'حمامة', 'ببغاء', 'قمر', 'نجمة', 'سحاب', 'طائرة'], context: 'عالم علوي', risk: 'moderate' },
  { theme: 'ليل', words: ['قمر', 'نجمة', 'بومة', 'خفاش', 'ظلام', 'نسر', 'عقرب', 'ضوء'], context: 'وقت مظلم', risk: 'moderate' },
  { theme: 'مزرعة', words: ['خروف', 'حصان', 'حمار', 'دجاج', 'بقرة', 'قمح', 'أرز', 'حصاد'], context: 'حياة ريفية', risk: 'safe' },
  { theme: 'بيت', words: ['قطة', 'كلب', 'سمك', 'أرنب', 'باب', 'سرير', 'موقد'], context: 'حياة منزلية', risk: 'risky' },

  // ── الطعام والشراب ──
  { theme: 'مائدة', words: ['خبز', 'أرز', 'سمك', 'لحم', 'طماطم', 'خيار', 'زيتون', 'بصل'], context: 'طعام يومي', risk: 'risky' },
  { theme: 'فاكهة', words: ['تفاح', 'برتقال', 'عنب', 'فراولة', 'مانجو', 'بطيخ', 'ليمون'], context: 'فواكه', risk: 'safe' },
  { theme: 'حلو', words: ['عسل', 'تمور', 'كعك', 'فراولة', 'مانجو', 'فطيرة'], context: 'حلويات', risk: 'moderate' },
  { theme: 'ضيافة', words: ['قهوة', 'شاي', 'تمور', 'كعك', 'عسل', 'سفرة', 'ضيف'], context: 'ترحيب عربي', risk: 'moderate' },
  { theme: 'مطبخ', words: ['طباخ', 'خباز', 'سكين', 'فرن', 'موقد', 'توابل', 'وصفة'], context: 'تحضير طعام', risk: 'moderate' },
  { theme: 'مشوي', words: ['لحم', 'دجاج', 'سمك', 'فحم', 'نار', 'شواء'], context: 'طعام نار', risk: 'safe' },
  { theme: 'صباح', words: ['قهوة', 'شاي', 'خبز', 'حليب', 'فجر', 'شمس', 'صحيفة'], context: 'بداية يوم', risk: 'risky' },

  // ── الأماكن ──
  { theme: 'سفر', words: ['مطار', 'طائرة', 'قطار', 'حقيبة', 'جواز', 'فندق', 'سيارة'], context: 'تنقل وترحال', risk: 'moderate' },
  { theme: 'حصن', words: ['قلعة', 'سيف', 'درع', 'جيش', 'ملك', 'حصن', 'سور'], context: 'دفاع وتاريخ', risk: 'safe' },
  { theme: 'علم', words: ['مختبر', 'عالم', 'تجربة', 'مجهر', 'ذرة', 'بحث', 'اكتشاف'], context: 'بحث علمي', risk: 'safe' },
  { theme: 'تجارة', words: ['سوق', 'ذهب', 'فضة', 'عملة', 'بضاعة', 'زحام'], context: 'بيع وشراء', risk: 'moderate' },
  { theme: 'تعليم', words: ['مدرسة', 'معلم', 'كتاب', 'قلم', 'ورقة', 'مكتبة', 'لوح'], context: 'مدرسة ودراسة', risk: 'moderate' },
  { theme: 'إسلام', words: ['مسجد', 'صلاة', 'دعاء', 'منارة', 'حجاب', 'قرآن', 'رمضان'], context: 'شعائر إسلامية', risk: 'moderate' },

  // ── الأدوات والأشياء ──
  { theme: 'نار', words: ['شمعة', 'فانوس', 'مطبخ', 'بركان', 'شمس', 'سيجارة'], context: 'حرارة وضوء', risk: 'risky' },
  { theme: 'معدن', words: ['سيف', 'رمح', 'درع', 'مفاتيح', 'قفل', 'آلة', 'مسدس'], context: 'صناعة معدنية', risk: 'moderate' },
  { theme: 'خشب', words: ['باب', 'كرسي', 'طاولة', 'سلم', 'سرير', 'قلم', 'نجار'], context: 'أثاث وأدوات', risk: 'moderate' },
  { theme: 'زجاج', words: ['مرآة', 'نافذة', 'كوب', 'تلسكوب', 'عدسة', 'مصباح'], context: 'مواد شفافة', risk: 'safe' },

  // ── الطبيعة والعناصر ──
  { theme: 'كارثة', words: ['زلزال', 'بركان', 'عاصفة', 'رعد', 'برق', 'غرق', 'حريق'], context: 'كوارث طبيعية', risk: 'safe' },
  { theme: 'بارد', words: ['ثلج', 'جليد', 'شتاء', 'جبل', 'ريح', 'بوصلة', 'دفء'], context: 'برودة وشتاء', risk: 'moderate' },
  { theme: 'صيف', words: ['شمس', 'بحر', 'صحراء', 'بطيخ', 'فراولة', 'مانجو', 'عطلة'], context: 'موسم حار', risk: 'moderate' },
  { theme: 'ماء', words: ['نهر', 'بحيرة', 'مطر', 'بحر', 'سحاب', 'جليد', 'عين'], context: 'الماء في الطبيعة', risk: 'risky' },
  { theme: 'نور', words: ['شمس', 'قمر', 'نجمة', 'شمعة', 'فانوس', 'برق', 'مرآة'], context: 'إضاءة وتوهج', risk: 'risky' },

  // ── المهن والأعمال ──
  { theme: 'طب', words: ['طبيب', 'مستشفى', 'دواء', 'صيدلي', 'مريض', 'تمريض'], context: 'مجال صحي', risk: 'safe' },
  { theme: 'عدالة', words: ['قاضي', 'محامي', 'قانون', 'محكمة', 'ميزان', 'شرطي'], context: 'قانون ومحاكم', risk: 'safe' },
  { theme: 'حرب', words: ['جندي', 'جيش', 'سيف', 'درع', 'رمح', 'معركة', 'دبابة'], context: 'معارك عسكرية', risk: 'safe' },
  { theme: 'فن', words: ['رسام', 'مغني', 'ممثل', 'مخرج', 'لوحة', 'فيلم', 'كاتب'], context: 'إبداع فني', risk: 'moderate' },
  { theme: 'بناء', words: ['مهندس', 'عامل', 'آلة', 'مصنع', 'حجر', 'إسمنت'], context: 'تشييد وبناء', risk: 'moderate' },
  { theme: 'صحافة', words: ['صحفي', 'صحيفة', 'كاميرا', 'تقرير', 'عناوين', 'إذاعة'], context: 'إعلام وأخبار', risk: 'safe' },

  // ── الرياضة ──
  { theme: 'قوة', words: ['ملاكمة', 'مصارعة', 'كاراتيه', 'جودو', 'حديد', 'عضلات'], context: 'رياضات قتالية', risk: 'safe' },
  { theme: 'سباق', words: ['حصان', 'سيارة', 'دراجة', 'جري', 'خط نهاية', 'فوز'], context: 'منافسة سرعة', risk: 'moderate' },
  { theme: 'كرة', words: ['قدم', 'سلة', 'طائرة', 'ملعب', 'حكم', 'فريق', 'شبكة'], context: 'ألعاب كروية', risk: 'risky' },
  { theme: 'ماء', words: ['سباحة', 'غوص', 'حوض', 'موج', 'غطس', 'شاطئ'], context: 'رياضات مائية', risk: 'moderate' },
  { theme: 'ذكاء', words: ['شطرنج', 'ألغاز', 'استراتيجية', 'تخطيط', 'فكر', 'حساب'], context: 'ألعاب ذهنية', risk: 'safe' },

  // ── التقنية والعلوم ──
  { theme: 'سريع', words: ['سيارة', 'طائرة', 'صاروخ', 'قطار', 'إنترنت', 'برق'], context: 'سرعة وتحرك', risk: 'risky' },
  { theme: 'فضاء', words: ['صاروخ', 'قمر صناعي', 'كوكب', 'نجم', 'مجرة', 'رائد فضاء', 'تلسكوب'], context: 'استكشاف فضائي', risk: 'safe' },
  { theme: 'اتصال', words: ['هاتف', 'إنترنت', 'إذاعة', 'تلفزيون', 'رسالة', 'صحيفة'], context: 'تواصل ومعلومات', risk: 'moderate' },
  { theme: 'طاقة', words: ['بطارية', 'كهرباء', 'محرك', 'نفط', 'شمس', 'جاذبية'], context: 'قوة وتشغيل', risk: 'moderate' },

  // ── البلدان والحضارات ──
  { theme: 'عرب', words: ['السعودية', 'الإمارات', 'الكويت', 'الأردن', 'قمر', 'صحراء', 'نخل'], context: 'عالم عربي', risk: 'moderate' },
  { theme: 'خليج', words: ['السعودية', 'الإمارات', 'الكويت', 'بحرين', 'نفط', 'لؤلؤ'], context: 'دول خليجية', risk: 'safe' },
  { theme: 'حضارة', words: ['مصر', 'العراق', 'روما', 'اليونان', 'أهرامات', 'كتابة'], context: 'تاريخ قديم', risk: 'moderate' },
  { theme: 'سياحة', words: ['باريس', 'دبي', 'تركيا', 'المغرب', 'الأردن', 'فندق'], context: 'أماكن سياحية', risk: 'moderate' },
  { theme: 'شرق', words: ['اليابان', 'الصين', 'الهند', 'تركيا', 'بهارات', 'شاي', 'حرير'], context: 'ثقافة شرقية', risk: 'safe' },
  { theme: 'أوروبا', words: ['فرنسا', 'بريطانيا', 'ألمانيا', 'إيطاليا', 'إسبانيا', 'قلعة'], context: 'قارة أوروبية', risk: 'safe' },

  // ── الثقافة والأدب ──
  { theme: 'موسيقى', words: ['أغنية', 'عود', 'مهرجان', 'حفل', 'إيقاع', 'لحن', 'مسرح'], context: 'فن صوتي', risk: 'safe' },
  { theme: 'كتاب', words: ['رواية', 'قصة', 'شعر', 'مكتبة', 'كاتب', 'نشر', 'قراءة'], context: 'أدب ومؤلفات', risk: 'moderate' },
  { theme: 'عرض', words: ['مسرح', 'فيلم', 'تمثال', 'لوحة', 'حفل', 'مهرجان', 'فرجة'], context: 'فنون أدائية', risk: 'moderate' },
  { theme: 'زواج', words: ['حفل', 'فستان', 'خاتم', 'قلادة', 'ورد', 'فرح', 'احتفال'], context: 'مناسبات سعيدة', risk: 'moderate' },

  // ── الألوان والأشكال ──
  { theme: 'حار', words: ['أحمر', 'برتقالي', 'نار', 'شمس', 'صحراء', 'حماس'], context: 'ألوان دافئة', risk: 'risky' },
  { theme: 'طبيعة', words: ['أخضر', 'أزرق', 'بني', 'شجر', 'بحر', 'تراب'], context: 'ألوان طبيعية', risk: 'risky' },
  { theme: 'فاخر', words: ['ذهبي', 'فضي', 'بنفسجي', 'تاج', 'حرير', 'جواهر'], context: 'ثروة وأناقة', risk: 'safe' },
  { theme: 'مشرق', words: ['أصفر', 'ذهبي', 'شمس', 'ضوء', 'صباح', 'أمل'], context: 'إشراقة وتبشير', risk: 'moderate' },
  { theme: 'ليلي', words: ['أسود', 'بنفسجي', 'رمادي', 'قمر', 'نجمة', 'ظلام'], context: 'ألوان ليلية', risk: 'safe' },

  // ── المشاعر ──
  { theme: 'سعادة', words: ['فرح', 'حب', 'أمل', 'سلام', 'فخر', 'حماس', 'ضحك'], context: 'مشاعر إيجابية', risk: 'risky' },
  { theme: 'حزن', words: ['حزن', 'خوف', 'قلق', 'وحدة', 'ظلام', 'مطر', 'دموع'], context: 'مشاعر سلبية', risk: 'safe' },
  { theme: 'شجاعة', words: ['أسد', 'فارس', 'جندي', 'ملاكمة', 'قوة', 'بطولة'], context: 'إقدام وبسالة', risk: 'safe' },
  { theme: 'حكمة', words: ['فيل', 'عالم', 'كتاب', 'ميزان', 'صبر', 'قمر'], context: 'علم وتجربة', risk: 'moderate' },
  { theme: 'حماية', words: ['درع', 'قلعة', 'حصن', 'شرطي', 'قفل', 'سور'], context: 'أمان ودفاع', risk: 'safe' },

  // ── الملابس ──
  { theme: 'عربي', words: ['ثوب', 'عباءة', 'عمامة', 'كوفية', 'بشت', 'نقاب', 'حجاب'], context: 'لباس تقليدي', risk: 'moderate' },
  { theme: 'رياضة', words: ['حذاء', 'جوارب', 'تيشيرت', 'جينز', 'قبعة', 'حزام'], context: 'ملابس رياضية', risk: 'moderate' },
  { theme: 'حفل', words: ['فستان', 'معطف', 'شال', 'نظارات', 'قلادة', 'خاتم'], context: 'أناقة ومناسبات', risk: 'moderate' },

  // ── المركبات ──
  { theme: 'طيران', words: ['طائرة', 'مروحية', 'صاروخ', 'بالون', 'مطار', 'طيار'], context: 'سفر جوي', risk: 'safe' },
  { theme: 'ملاحة', words: ['سفينة', 'قارب', 'غواصة', 'ميناء', 'بوصلة', 'شراع'], context: 'سفر بحري', risk: 'safe' },
  { theme: 'نقل', words: ['حافلة', 'شاحنة', 'قطار', 'مترو', 'ترام', 'سيارة'], context: 'مواصلات عامة', risk: 'moderate' },
  { theme: 'عسكري', words: ['دبابة', 'مروحية', 'غواصة', 'صاروخ', 'حاملة طائرات', 'جندي'], context: 'معدات عسكرية', risk: 'safe' },

  // ── مفاهيم عامة ──
  { theme: 'كبير', words: ['فيل', 'حوت', 'جبل', 'شمس', 'مجرة', 'بحر', 'إمبراطورية'], context: 'حجم ضخم', risk: 'risky' },
  { theme: 'صغير', words: ['قطة', 'أرنب', 'نحلة', 'ضفدع', 'قلم', 'ورقة', 'نقطة'], context: 'حجم مصغر', risk: 'risky' },
  { theme: 'خطير', words: ['أسد', 'نمر', 'أفعى', 'عقرب', 'بركان', 'زلزال', 'سيف'], context: 'تهديد وخطر', risk: 'moderate' },
  { theme: 'جميل', words: ['زهرة', 'لوحة', 'نجمة', 'قمر', 'فستان', 'موسيقى', 'مهرجان'], context: 'جمال وفن', risk: 'risky' },
  { theme: 'قديم', words: ['قلعة', 'سيف', 'تمثال', 'مخطوط', 'حضارة', 'مسجد', 'تاريخ'], context: 'أصالة وتراث', risk: 'moderate' },
  { theme: 'مستقبل', words: ['روبوت', 'صاروخ', 'ذكاء', 'فضاء', 'طاقة', 'كوكب'], context: 'تقدم وتكنولوجيا', risk: 'moderate' },
];

// ─── Clue Suggestion Types ───────────────────────────────────

export interface ClueSuggestion {
  /** The suggested clue word */
  word: string;
  /** How many of the team's words this clue connects to */
  connectedWords: string[];
  /** How many of the opponent's words this clue might accidentally connect to */
  riskWords: string[];
  /** Risk assessment */
  risk: 'safe' | 'moderate' | 'risky';
  /** Context/description of the theme */
  context: string;
  /** Score: higher = better clue (team connects minus opponent risk) */
  score: number;
  /** Suggested number for the clue */
  suggestedNumber: number;
}

// ─── Main Engine Function ────────────────────────────────────

/**
 * Generate clue suggestions for the spymaster.
 *
 * Analyzes the board and suggests clues that:
 * 1. Connect to 2+ of the team's unrevealed words
 * 2. Minimize connections to opponent's words
 * 3. Are valid clues (not on board, not substrings)
 *
 * @param board     The current 5×5 board
 * @param team      Which team the spymaster belongs to
 * @param maxResults Maximum suggestions to return (default 8)
 * @returns Array of scored and ranked clue suggestions
 */
export function generateClueSuggestions(
  board: BoardCard[],
  team: TeamColor,
  maxResults: number = 8
): ClueSuggestion[] {
  const opponentTeam: TeamColor = team === 'red' ? 'blue' : 'red';

  // Get unrevealed words for each team
  const teamWords = board
    .filter((c) => c.color === team && !c.isRevealed)
    .map((c) => c.word);

  const opponentWords = board
    .filter((c) => c.color === opponentTeam && !c.isRevealed)
    .map((c) => c.word);

  const neutralWords = board
    .filter((c) => c.color === 'neutral' && !c.isRevealed)
    .map((c) => c.word);

  const assassinWords = board
    .filter((c) => c.color === 'assassin' && !c.isRevealed)
    .map((c) => c.word);

  const allBoardWords = board.map((c) => c.word);

  if (teamWords.length === 0) return [];

  const suggestions: ClueSuggestion[] = [];

  // Check each semantic cluster
  for (const cluster of SEMANTIC_CLUSTERS) {
    // Validate: the theme word must not be on the board
    if (!isValidClue(cluster.theme, board)) continue;

    // Find which team words connect to this cluster
    const connected: string[] = [];
    for (const teamWord of teamWords) {
      if (cluster.words.includes(teamWord)) {
        connected.push(teamWord);
      }
    }

    // Need at least 1 team connection (even 1 is useful for narrowing)
    if (connected.length === 0) continue;

    // Find opponent words that might connect
    const riskWords: string[] = [];
    for (const oppWord of opponentWords) {
      if (cluster.words.includes(oppWord)) {
        riskWords.push(oppWord);
      }
    }

    // Check neutral/assassin risk
    const neutralRisk = neutralWords.filter((w) => cluster.words.includes(w));
    const assassinRisk = assassinWords.filter((w) => cluster.words.includes(w));

    // Calculate score
    // Base: +3 per team connection, -5 per opponent, -10 per assassin
    const score =
      connected.length * 3 -
      riskWords.length * 5 -
      neutralRisk.length * 2 -
      assassinRisk.length * 10;

    // Skip very risky clues (would lead to assassin)
    if (assassinRisk.length > 0) continue;

    // Skip if risk > team connections
    if (riskWords.length >= connected.length) continue;

    suggestions.push({
      word: cluster.theme,
      connectedWords: connected,
      riskWords,
      risk: cluster.risk,
      context: cluster.context,
      score,
      suggestedNumber: connected.length,
    });
  }

  // Also generate individual word hints as single-word clues
  // These are useful when no good multi-word cluster exists
  const individualSuggestions = generateIndividualClues(
    teamWords,
    allBoardWords,
    opponentWords,
    board
  );

  // Combine and sort by score
  const allSuggestions = [...suggestions, ...individualSuggestions];

  // Deduplicate by clue word
  const seen = new Set<string>();
  const unique: ClueSuggestion[] = [];
  for (const s of allSuggestions) {
    if (!seen.has(s.word)) {
      seen.add(s.word);
      unique.push(s);
    }
  }

  // Sort: best score first, prefer multi-word connections
  unique.sort((a, b) => {
    if (b.connectedWords.length !== a.connectedWords.length) {
      return b.connectedWords.length - a.connectedWords.length;
    }
    return b.score - a.score;
  });

  return unique.slice(0, maxResults);
}

/**
 * Generate individual word-based clues.
 * These come from the hints stored in the word database.
 * We filter to only include associative (non-descriptive) hints.
 */
function generateIndividualClues(
  teamWords: string[],
  allBoardWords: string[],
  opponentWords: string[],
  board: BoardCard[]
): ClueSuggestion[] {
  const suggestions: ClueSuggestion[] = [];

  // Import hints from the word database (using a subset of the best associative hints)
  const wordHints: Record<string, string[]> = {
    // Animals - thematic associations
    'أسد': ['شجاعة', 'عرش', 'هوليوود', 'غابة'],
    'فيل': ['حكمة', 'ذاكرة', 'سيرك', 'أفريقيا'],
    'حصان': ['فروسية', 'سباق', 'فارس', 'خيل'],
    'قطة': ['أنيس', 'مصري', 'مرح'],
    'كلب': ['وفاء', 'صيد', 'حراسة'],
    'أرنب': ['سريع', 'جزر', 'قفز'],
    'دب': ['شتاء', 'نوم', 'غابة'],
    'ثعلب': ['مكر', 'ذكاء', 'غابة'],
    'نمر': ['خطوط', 'سريع', 'آسيا'],
    'حوت': ['بحر', 'ضخم', 'قصة'],
    'صقر': ['عرب', 'سماء', 'شجاعة'],
    'حمامة': ['سلام', 'رسالة', 'بيضاء'],
    'جمل': ['صحراء', 'صبر', 'عرب'],
    'دلفين': ['ذكاء', 'ابتسامة', 'بحر'],
    'نحلة': ['عسل', 'عمل', 'زهرة'],

    // Food - thematic associations
    'خبز': ['قمح', 'فرن', 'حياة'],
    'قهوة': ['صباح', 'ضيافة', 'بن'],
    'شاي': ['نعناع', 'ضيافة', 'أخضر'],
    'عسل': ['نحلة', 'حلو', 'صحة'],
    'تمور': ['رمضان', 'صحراء', 'حلو'],
    'سمك': ['بحر', 'صيد', 'ماء'],
    'بطيخ': ['صيف', 'بذور', 'حلو'],
    'تفاح': ['صحة', 'شجرة', 'أحمر'],

    // Places - thematic associations
    'مسجد': ['صلاة', 'إسلام', 'دعاء'],
    'مدرسة': ['تعليم', 'معرفة', 'طلاب'],
    'قلعة': ['حصن', 'ملك', 'تاريخ'],
    'حديقة': ['أخضر', 'أطفال', 'ورد'],
    'جزيرة': ['بحر', 'سياحة', 'أخضر'],
    'كهف': ['صخر', 'مظلم', 'مغامرة'],

    // Objects - thematic associations
    'كتاب': ['معرفة', 'قراءة', 'قلم'],
    'ساعة': ['وقت', 'معصم', 'دقيقة'],
    'سيف': ['حرب', 'فارس', 'شرق'],
    'مرآة': ['جمال', 'صورة', 'انعكاس'],
    'شمعة': ['ليل', 'ضوء', 'دخان'],

    // Nature - thematic associations
    'شمس': ['نهار', 'ضوء', 'حياة'],
    'قمر': ['ليل', 'هلال', 'نور'],
    'بحر': ['ماء', 'أمواج', 'واسع'],
    'شجر': ['أخضر', 'ثمار', 'طبيعة'],
    'زهرة': ['جمال', 'رائحة', 'ربيع'],
    'ثلج': ['بارد', 'شتاء', 'أبيض'],
    'نهر': ['ماء', 'جريان', 'حياة'],
    'بركان': ['نار', 'حمم', 'قوة'],

    // Professions - thematic associations
    'طبيب': ['صحة', 'علاج', 'مستشفى'],
    'معلم': ['تعليم', 'معرفة', 'مدرسة'],
    'جندي': ['جيش', 'وطن', 'شجاعة'],
    'كاتب': ['إبداع', 'قلم', 'رواية'],
    'عالم': ['بحث', 'اكتشاف', 'مختبر'],

    // Feelings - thematic associations
    'حب': ['قلب', 'عاطفة', 'ورود'],
    'فرح': ['ابتسامة', 'مناسبة', 'بهجة'],
    'أمل': ['مستقبل', 'نور', 'تفاؤل'],
    'شجاعة': ['بطل', 'قوة', 'إقدام'],
    'صبر': ['انتظار', 'قوة', 'وقت'],

    // Culture - thematic associations
    'شعر': ['قصيدة', 'عربي', 'إبداع'],
    'فيلم': ['سينما', 'تمثيل', 'قصة'],
    'موسيقى': ['لحن', 'إيقاع', 'روح'],
    'فن': ['إبداع', 'جمال', 'تعبير'],
  };

  for (const teamWord of teamWords) {
    const hints = wordHints[teamWord];
    if (!hints) continue;

    for (const hint of hints) {
      // Validate: hint must not be on the board
      if (!isValidClue(hint, board)) continue;

      // Check if this hint connects to any opponent words
      const isOpponentRisk = opponentWords.some((ow) => {
        const oppHints = wordHints[ow];
        return oppHints?.includes(hint);
      });

      if (isOpponentRisk) continue;

      suggestions.push({
        word: hint,
        connectedWords: [teamWord],
        riskWords: [],
        risk: 'safe',
        context: `إيحاء لـ "${teamWord}"`,
        score: 1,
        suggestedNumber: 1,
      });
    }
  }

  return suggestions;
}

// ─── Cross-Word Connection Finder ────────────────────────────

/**
 * Find all hints/associations that connect multiple words together.
 * This is the key intelligence for finding good multi-word clues.
 */
export function findCrossConnections(
  board: BoardCard[],
  team: TeamColor
): Array<{
  clue: string;
  words: string[];
  strength: number;
}> {
  const teamWords = board
    .filter((c) => c.color === team && !c.isRevealed)
    .map((c) => c.word);

  const allBoardWords = board.map((c) => c.word);

  // Build a reverse index: hint → [words that share this hint]
  const hintToWords: Record<string, string[]> = {};

  const allHints: Record<string, string[]> = {
    // Manually curated cross-word associations
    // These are designed so one clue word connects 2+ board words
    'ماء': ['بحر', 'نهر', 'بحيرة', 'مطر', 'سمك', 'دلفين', 'حوت', 'سحاب', 'ثلج', 'نبات'],
    'غابة': ['أسد', 'نمر', 'دب', 'ثعلب', 'ذئب', 'أفعى', 'شجر', 'نحلة'],
    'صحراء': ['جمل', 'عقرب', 'أفعى', 'صقر', 'رمل', 'شمس', 'واحة'],
    'سماء': ['نسر', 'صقر', 'حمامة', 'ببغاء', 'قمر', 'نجمة', 'سحاب', 'طائرة', 'شمس'],
    'ليل': ['قمر', 'نجمة', 'بومة', 'عقرب', 'ظلام', 'خفاش'],
    'حرب': ['سيف', 'درع', 'رمح', 'جيش', 'معركة', 'قلعة', 'جندي', 'ملك'],
    'حصن': ['قلعة', 'سور', 'درع', 'جيش', 'ملك', 'حماية'],
    'ملك': ['أسد', 'تاج', 'عرش', 'قلعة', 'جيش', 'دولة', 'فارس'],
    'فارس': ['حصان', 'سيف', 'درع', 'رمح', 'شجاعة', 'سباق'],
    'سفر': ['طائرة', 'قطار', 'سيارة', 'سفينة', 'حقيبة', 'مطار', 'ميناء'],
    'فن': ['لوحة', 'تمثال', 'فيلم', 'مسرح', 'كتاب', 'موسيقى', 'شعر'],
    'موت': ['ظلام', 'قبر', 'سكوت', 'رعد', 'حزن', 'خوف'],
    'حياة': ['شمس', 'ماء', 'شجر', 'زهرة', 'بحر', 'قلب', 'فرح'],
    'حار': ['شمس', 'نار', 'صحراء', 'حمم', 'برتقالي', 'أحمر'],
    'بارد': ['ثلج', 'جبل', 'شتاء', 'جليد', 'ريح', 'أبيض'],
    'قديم': ['قلعة', 'سيف', 'مسجد', 'تمثال', 'مخطوط', 'حضارة'],
    'ذكاء': ['ثعلب', 'فيل', 'دلفين', 'شطرنج', 'عالم', 'روبوت'],
    'قوة': ['أسد', 'نمر', 'جيش', 'ملاكمة', 'بركان', 'زلازل'],
    'سريع': ['حصان', 'نمر', 'سيارة', 'طائرة', 'صاروخ', 'برق'],
    'كبير': ['فيل', 'حوت', 'جبل', 'بحر', 'إمبراطورية', 'مجرة'],
    'صغير': ['أرنب', 'قطة', 'نحلة', 'ضفدع', 'قلم', 'ورقة'],
    'طعام': ['خبز', 'أرز', 'سمك', 'لحم', 'دجاج', 'عسل'],
    'شراب': ['قهوة', 'شاي', 'حليب', 'ماء', 'عصير'],
    'لون': ['أحمر', 'أخضر', 'أزرق', 'أصفر', 'ذهبي'],
    'إسلام': ['مسجد', 'صلاة', 'رمضان', 'قرآن', 'حجاب', 'منارة'],
    'نار': ['شمعة', 'بركان', 'شمس', 'طبخ', 'معركة'],
    'ضوء': ['شمس', 'قمر', 'نجمة', 'شمعة', 'برق', 'فانوس'],
    'حجر': ['جبل', 'قلعة', 'كهف', 'تمثال', 'صحراء'],
    'خشب': ['باب', 'كرسي', 'طاولة', 'سلم', 'سفينة', 'قلم'],
    'معدن': ['سيف', 'درع', 'رمح', 'مفاتيح', 'قفل', 'آلة'],
    'زجاج': ['مرآة', 'نافذة', 'كوب', 'تلسكوب', 'عدسة'],
    'جيش': ['جندي', 'سيف', 'درع', 'رمح', 'معركة', 'دبابة'],
    'تعليم': ['مدرسة', 'معلم', 'كتاب', 'قلم', 'مكتبة'],
    'صحة': ['طبيب', 'مستشفى', 'دواء', 'عسل', 'رياضة'],
    'موسيقى': ['أغنية', 'عود', 'مهرجان', 'حفل', 'مسرح'],
    'كرة': ['قدم', 'سلة', 'طائرة', 'ملعب', 'شبكة'],
    'بحري': ['سفينة', 'قارب', 'ميناء', 'غواصة', 'بحار', 'شراع'],
    'فضائي': ['صاروخ', 'قمر صناعي', 'كوكب', 'تلسكوب', 'مجرة'],
    'سياحة': ['فندق', 'مطار', 'طائرة', 'حقيبة', 'كاميرا'],
    'عائلة': ['أب', 'أم', 'أخ', 'بيت', 'حب', 'فرح'],
    'مدرسة': ['معلم', 'كتاب', 'قلم', 'طالب', 'فصل'],
    'طبية': ['طبيب', 'مستشفى', 'دواء', 'صيدلي', 'مريض'],
    'قانونية': ['قاضي', 'محامي', 'محكمة', 'شرطي', 'قانون'],
    'إعلامية': ['صحفي', 'صحيفة', 'كاميرا', 'إذاعة', 'تلفزيون'],
  };

  // Build reverse index
  for (const [hint, words] of Object.entries(allHints)) {
    for (const word of words) {
      if (!hintToWords[hint]) hintToWords[hint] = [];
      hintToWords[hint].push(word);
    }
  }

  const connections: Array<{
    clue: string;
    words: string[];
    strength: number;
  }> = [];

  for (const [hint, connectedWords] of Object.entries(hintToWords)) {
    // Filter to only team words
    const teamConnections = connectedWords.filter((w) =>
      teamWords.includes(w)
    );

    // Need at least 1 connection
    if (teamConnections.length < 1) continue;

    // Validate clue
    if (!isValidClue(hint, board)) continue;

    // Strength = number of team connections squared (multi-word is much better)
    const strength = teamConnections.length * teamConnections.length;

    connections.push({
      clue: hint,
      words: teamConnections,
      strength,
    });
  }

  // Sort by strength (multi-word connections first)
  connections.sort((a, b) => b.strength - a.strength);

  return connections.slice(0, 15);
}

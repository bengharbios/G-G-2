// ============================================================
// فاميلي فيود (Family Feud) - Question Database
// 95+ Arabic survey questions + 10 fast money questions
// ============================================================

export interface Answer {
  text: string;
  points: number;
  revealed: boolean;
}

export interface Question {
  question: string;
  answers: Answer[];
  category?: string;
  categoryIcon?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Helper to get difficulty based on total points
export function getQuestionDifficulty(points: number): 'easy' | 'medium' | 'hard' {
  if (points <= 40) return 'easy';
  if (points <= 70) return 'medium';
  return 'hard';
}

// Get difficulty info for display
export function getDifficultyInfo(diff: 'easy' | 'medium' | 'hard'): { icon: string; label: string; color: string } {
  switch (diff) {
    case 'easy': return { icon: '🟢', label: 'سهل', color: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' };
    case 'medium': return { icon: '🟡', label: 'متوسط', color: 'bg-amber-500/20 border-amber-500/60 text-amber-300' };
    case 'hard': return { icon: '🔴', label: 'صعب', color: 'bg-rose-500/20 border-rose-500/60 text-rose-300' };
  }
}

// Helper to get category info for questions
export function getQuestionCategory(q: Question): { icon: string; label: string } {
  if (q.category && q.categoryIcon) return { icon: q.categoryIcon, label: q.category };
  const text = q.question;
  if (text.includes("طعام") || text.includes("بيتزا") || text.includes("بسكويت") || text.includes("لزج") || text.includes("شراب") || text.includes("أكل") || text.includes("عشاء") || text.includes("قهوة") || text.includes("فطور"))
    return { icon: "🍕", label: "طعام" };
  if (text.includes("حيوان") || text.includes("كلب") || text.includes("قط"))
    return { icon: "🐾", label: "حيوانات" };
  if (text.includes("مكان") || text.includes("منزل") || text.includes("مرآب"))
    return { icon: "🏠", label: "منزل" };
  if (text.includes("مهنة") || text.includes("عمل"))
    return { icon: "👔", label: "مهن" };
  if (text.includes("رياض") || text.includes("كرة"))
    return { icon: "⚽", label: "رياضة" };
  if (text.includes("خاف") || text.includes("مخيف"))
    return { icon: "😱", label: "مخاوف" };
  if (text.includes("أطفال") || text.includes("طفل"))
    return { icon: "👶", label: "أطفال" };
  if (text.includes("لعب") || text.includes("ألعاب") || text.includes("حفل") || text.includes("ترفيه"))
    return { icon: "🎮", label: "ترفيه" };
  if (text.includes("سفر") || text.includes("طائرة") || text.includes("رحلة"))
    return { icon: "✈️", label: "سفر" };
  if (text.includes("نوم") || text.includes("ليل") || text.includes("صباح"))
    return { icon: "🌙", label: "حياة يومية" };
  return { icon: "❓", label: "عام" };
}

export const ALL_QUESTIONS: Question[] = [
  // --- 65 questions from provided list ---
  {
    question: "اذكر شيئاً تأكله مع الخبز:",
    category: "طعام", categoryIcon: "🍞",
    answers: [
      { text: "فول مدمس", points: 25, revealed: false },
      { text: "جبنة", points: 24, revealed: false },
      { text: "زيت زيتون", points: 21, revealed: false },
      { text: "بيض", points: 16, revealed: false },
      { text: "طحينة", points: 14, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس غالباً في الليل:",
    category: "حياة يومية", categoryIcon: "🌙",
    answers: [
      { text: "قراءة كتاب", points: 26, revealed: false },
      { text: "استخدام الهاتف", points: 23, revealed: false },
      { text: "مشاهدة المسلسلات", points: 20, revealed: false },
      { text: "لعب ألعاب فيديو", points: 17, revealed: false },
      { text: "تأمل", points: 14, revealed: false },
    ],
  },
  {
    question: "اذكر أشياء ساخنة:",
    category: "طبيعة", categoryIcon: "🔥",
    answers: [
      { text: "نار", points: 26, revealed: false },
      { text: "قهوة", points: 24, revealed: false },
      { text: "شاي", points: 21, revealed: false },
      { text: "شمس", points: 16, revealed: false },
      { text: "صحراء", points: 13, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً مفتوناً به الكثير من الأطفال:",
    category: "ترفيه", categoryIcon: "🎮",
    answers: [
      { text: "ألعاب فيديو/كمبيوتر", points: 41, revealed: false },
      { text: "حلويات/وجبات سريعة", points: 29, revealed: false },
      { text: "تلفزيون", points: 20, revealed: false },
      { text: "موسيقى", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخاف منه بعض الناس ركوبه:",
    category: "سفر", categoryIcon: "✈️",
    answers: [
      { text: "طائرة", points: 44, revealed: false },
      { text: "دراجة نارية", points: 21, revealed: false },
      { text: "أفعوانية/لعبة ملاهي", points: 16, revealed: false },
      { text: "قارب", points: 4, revealed: false },
      { text: "حصان", points: 4, revealed: false },
      { text: "مصعد", points: 3, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً ذا طاقة عالية يذهب إليه الناس:",
    category: "ترفيه", categoryIcon: "🎭",
    answers: [
      { text: "ملعب رياضي", points: 28, revealed: false },
      { text: "حفل موسيقي", points: 27, revealed: false },
      { text: "حفل زفاف", points: 15, revealed: false },
      { text: "سينما", points: 8, revealed: false },
      { text: "مدينة ملاهي", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً شائعاً يخاف منه الناس:",
    category: "مخاوف", categoryIcon: "😱",
    answers: [
      { text: "الارتفاعات", points: 50, revealed: false },
      { text: "العناكب", points: 25, revealed: false },
      { text: "التحدث أمام الجمهور", points: 15, revealed: false },
      { text: "الطيران", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفقده الرجال طوال الوقت:",
    category: "حياة يومية", categoryIcon: "🔑",
    answers: [
      { text: "المفاتيح", points: 50, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "المحفظة", points: 15, revealed: false },
      { text: "النظارات الشمسية", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر حيواناً له رقبة طويلة:",
    category: "حيوانات", categoryIcon: "🦒",
    answers: [
      { text: "زرافة", points: 78, revealed: false },
      { text: "نعامة", points: 10, revealed: false },
      { text: "بجعة", points: 3, revealed: false },
      { text: "كركي", points: 3, revealed: false },
      { text: "بطة", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تجد فيه النساء مفاتيحهن:",
    category: "منزل", categoryIcon: "🏠",
    answers: [
      { text: "في المنزل", points: 55, revealed: false },
      { text: "في المول", points: 17, revealed: false },
      { text: "في حقيبة اليد", points: 10, revealed: false },
      { text: "في السيارة", points: 7, revealed: false },
      { text: "في المكتب", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تقابل فيه الناس شريك حياتهم:",
    category: "علاقات", categoryIcon: "💕",
    answers: [
      { text: "المدرسة/الجامعة", points: 56, revealed: false },
      { text: "الكنيسة/المسجد", points: 26, revealed: false },
      { text: "مناسبات عائلية", points: 9, revealed: false },
      { text: "طبيب/طبيبة أسنان", points: 4, revealed: false },
      { text: "العمل", points: 2, revealed: false },
    ],
  },
  {
    question: "إذا كان عليك إنفاق ألف دولار في ساعة، ماذا تشتري؟",
    category: "تسوق", categoryIcon: "🛒",
    answers: [
      { text: "ملابس", points: 22, revealed: false },
      { text: "إلكترونيات", points: 20, revealed: false },
      { text: "هاتف", points: 18, revealed: false },
      { text: "ذهب/مجوهرات", points: 15, revealed: false },
      { text: "طعام", points: 12, revealed: false },
    ],
  },
  {
    question: "ما الذي يضعه الناس في البيتزا ولا يجب أن يكون هناك؟",
    category: "طعام", categoryIcon: "🍕",
    answers: [
      { text: "أناناس", points: 44, revealed: false },
      { text: "سردين/سمك", points: 21, revealed: false },
      { text: "باذنجان", points: 2, revealed: false },
    ],
  },
  {
    question: "ما هو الشيء الذي يجب أن يفعله الناس بعد الأكل؟",
    category: "حياة يومية", categoryIcon: "🪥",
    answers: [
      { text: "غسل الأسنان", points: 26, revealed: false },
      { text: "تمشيط الشعر", points: 23, revealed: false },
      { text: "تسريح الشعر", points: 19, revealed: false },
      { text: "تفقد الملابس", points: 17, revealed: false },
      { text: "التدرب على الرقص", points: 15, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً يختبئ فيه الوحش عند الأطفال:",
    category: "أطفال", categoryIcon: "👹",
    answers: [
      { text: "تحت السرير", points: 45, revealed: false },
      { text: "داخل الخزانة", points: 36, revealed: false },
      { text: "خلف الباب", points: 7, revealed: false },
      { text: "الخزانة/الملزقة", points: 2, revealed: false },
      { text: "تحت الدرج", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفقدره عندما تنقطع الكهرباء:",
    category: "منزل", categoryIcon: "💡",
    answers: [
      { text: "التلفزيون", points: 50, revealed: false },
      { text: "الواي فاي/الإنترنت", points: 23, revealed: false },
      { text: "المكيف", points: 13, revealed: false },
      { text: "الإضاءة", points: 4, revealed: false },
    ],
  },
  {
    question: "اذكر مناسبة يرتدي فيها الناس ملابس خاصة:",
    category: "مناسبات", categoryIcon: "👗",
    answers: [
      { text: "التخرج", points: 32, revealed: false },
      { text: "الزفاف", points: 26, revealed: false },
      { text: "العطلات", points: 20, revealed: false },
      { text: "حفل ميلاد", points: 14, revealed: false },
      { text: "حفل تخريج جامعي", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي يخيف الناس في الأفعوانية؟",
    category: "مخاوف", categoryIcon: "🎢",
    answers: [
      { text: "السرعة", points: 77, revealed: false },
      { text: "الارتفاع", points: 8, revealed: false },
      { text: "السقوط", points: 3, revealed: false },
      { text: "الزلاقة", points: 3, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تفعله في الصباح؟",
    category: "حياة يومية", categoryIcon: "☀️",
    answers: [
      { text: "الهاتف", points: 59, revealed: false },
      { text: "طعام/شراب", points: 12, revealed: false },
      { text: "قهوة", points: 12, revealed: false },
      { text: "طفل يبكي", points: 11, revealed: false },
      { text: "إفطار", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر آلة موسيقية يسهل العزف عليها:",
    category: "موسيقى", categoryIcon: "🎵",
    answers: [
      { text: "جيتار", points: 69, revealed: false },
      { text: "الدف", points: 21, revealed: false },
      { text: "قيثارة", points: 4, revealed: false },
      { text: "بيانو", points: 2, revealed: false },
    ],
  },
  {
    question: "ما هو الشيء الذي يكره الناس تنظيفه؟",
    answers: [
      { text: "الحمام", points: 45, revealed: false },
      { text: "غسل الأطباق", points: 25, revealed: false },
      { text: "تنظيف الأرضية", points: 20, revealed: false },
      { text: "الغسيل", points: 10, revealed: false },
    ],
  },
  {
    question: "ما نوع المشروبات التي تسبب المتاعب؟",
    answers: [
      { text: "قهوة", points: 37, revealed: false },
      { text: "مشروبات غازية", points: 28, revealed: false },
      { text: "شاي", points: 17, revealed: false },
      { text: "مشاكل", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر مهنة تبدأ بحرف السين:",
    answers: [
      { text: "سائق", points: 40, revealed: false },
      { text: "سكرتير", points: 20, revealed: false },
      { text: "ساعي بريد", points: 15, revealed: false },
      { text: "ساحر", points: 15, revealed: false },
      { text: "سباك", points: 10, revealed: false },
    ],
  },
  {
    question: "إذا جلست بجانب شخص كريه الرائحة، ماذا تفعل؟",
    answers: [
      { text: "تبديل المقعد", points: 39, revealed: false },
      { text: "تغطية الأنف", points: 24, revealed: false },
      { text: "إدارة الرأس", points: 6, revealed: false },
      { text: "فتح النافذة", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر نوع بيت مخيف:",
    answers: [
      { text: "بيت مسكون", points: 27, revealed: false },
      { text: "بيت الكلب", points: 8, revealed: false },
      { text: "بيت زجاجي", points: 6, revealed: false },
      { text: "بيت مهجور", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تحب فيه النوم:",
    answers: [
      { text: "السرير", points: 46, revealed: false },
      { text: "غرفة المعيشة", points: 27, revealed: false },
      { text: "السينما", points: 9, revealed: false },
      { text: "السيارة", points: 4, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تنظفه قبل وصول الضيوف؟",
    answers: [
      { text: "الحمام", points: 59, revealed: false },
      { text: "المطبخ", points: 18, revealed: false },
      { text: "الأرضيات", points: 11, revealed: false },
      { text: "غرفة المعيشة", points: 3, revealed: false },
    ],
  },
  {
    question: "اذكر وحشاً أو كائناً مخيفاً من الأساطير:",
    answers: [
      { text: "الغول", points: 35, revealed: false },
      { text: "العنقاء", points: 25, revealed: false },
      { text: "الجن", points: 20, revealed: false },
      { text: "الغيلان", points: 12, revealed: false },
      { text: "العنكبوت العملاق", points: 8, revealed: false },
    ],
  },
  {
    question: "ما أكثر عذر شائع للتأخر عن العمل؟",
    answers: [
      { text: "نمت متأخراً", points: 52, revealed: false },
      { text: "زحمة سير", points: 25, revealed: false },
      { text: "مشكلة بالسيارة", points: 17, revealed: false },
      { text: "مريض", points: 6, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء تحبه في الحفلات؟",
    answers: [
      { text: "الرقص", points: 45, revealed: false },
      { text: "التحدث مع الناس", points: 21, revealed: false },
      { text: "أكل الحلويات", points: 18, revealed: false },
      { text: "الأكل", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شخصية كرتونية يعرفها الجميع:",
    answers: [
      { text: "ميكي ماوس", points: 30, revealed: false },
      { text: "سبونج بوب", points: 25, revealed: false },
      { text: "توم وجيري", points: 20, revealed: false },
      { text: "بن تن", points: 15, revealed: false },
      { text: "باباي", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي كنت تفعله كل يوم في الروضة و تتمنى تفعله الآن؟",
    answers: [
      { text: "أخذ قيلولة", points: 64, revealed: false },
      { text: "اللعب بالألعاب", points: 19, revealed: false },
      { text: "التلوين/الرسم", points: 12, revealed: false },
      { text: "وجبات مجانية", points: 4, revealed: false },
    ],
  },
  {
    question: "اذكر بعض أبطال مارفل (الانتقامون):",
    answers: [
      { text: "كابتن أمريكا", points: 22, revealed: false },
      { text: "آيرون مان", points: 22, revealed: false },
      { text: "الرجل الأسود", points: 20, revealed: false },
      { text: "الهالك", points: 15, revealed: false },
      { text: "ثور", points: 15, revealed: false },
    ],
  },
  {
    question: "لماذا قد يركب شخص الدراجة للعمل؟",
    answers: [
      { text: "ليس لديه سيارة", points: 46, revealed: false },
      { text: "للرياضة", points: 23, revealed: false },
      { text: "لتوفير البنزين", points: 20, revealed: false },
      { text: "للبيئة", points: 7, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة تقال للرجل الكبير في السن:",
    answers: [
      { text: "عم", points: 35, revealed: false },
      { text: "حج", points: 25, revealed: false },
      { text: "أبو فلان", points: 20, revealed: false },
      { text: "الشيخ", points: 12, revealed: false },
      { text: "الخال", points: 8, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يفقده الرجال في البيت؟",
    answers: [
      { text: "ريموت التلفزيون", points: 34, revealed: false },
      { text: "شاحن الهاتف", points: 22, revealed: false },
      { text: "جوارب", points: 18, revealed: false },
      { text: "مفاتيح", points: 14, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يفتقده الناس عن طفولتهم؟",
    answers: [
      { text: "ملاعب/أرجوحة", points: 28, revealed: false },
      { text: "كرتون", points: 24, revealed: false },
      { text: "حلوى", points: 20, revealed: false },
      { text: "ركوب الدراجة", points: 16, revealed: false },
      { text: "سهرات مع الأصدقاء", points: 12, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يضايقك في تنظيف المنزل؟",
    answers: [
      { text: "سقوط شيء", points: 34, revealed: false },
      { text: "عودة الغبار", points: 22, revealed: false },
      { text: "ظهور آثار أقدام", points: 18, revealed: false },
      { text: "تساقط شعر الكلب", points: 16, revealed: false },
    ],
  },
  {
    question: "وجبة خفيفة يحبها الأطفال:",
    answers: [
      { text: "رقائق بطاطس", points: 40, revealed: false },
      { text: "تفاح", points: 22, revealed: false },
      { text: "حبوب إفطار", points: 16, revealed: false },
      { text: "فشار", points: 12, revealed: false },
      { text: "جزر", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل شخص عندما يتحدث كثيراً ولا يعرف كيف يوقف؟",
    answers: [
      { text: "يقول 'المهم...'", points: 30, revealed: false },
      { text: "يضحك بشكل محرج", points: 24, revealed: false },
      { text: "يسأل سؤال فجأة", points: 20, revealed: false },
      { text: "ينظر للساعة", points: 16, revealed: false },
    ],
  },
  {
    question: "ما عادة سيئة يعاني منها الكثيرون؟",
    answers: [
      { text: "التدخين", points: 45, revealed: false },
      { text: "قضم الأظافر", points: 20, revealed: false },
      { text: "الإفراط في الأكل", points: 15, revealed: false },
      { text: "السب", points: 10, revealed: false },
      { text: "الكسل", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي لا يملك الناس ما يكفي منه؟",
    answers: [
      { text: "المال", points: 39, revealed: false },
      { text: "الوقت", points: 27, revealed: false },
      { text: "النوم", points: 17, revealed: false },
      { text: "الطاقة", points: 10, revealed: false },
      { text: "أيام إجازة", points: 7, revealed: false },
    ],
  },
  {
    question: "ما الذي يأخذه الناس معهم في السفر؟",
    answers: [
      { text: "حقائب سفر", points: 29, revealed: false },
      { text: "ملابس/أحذية", points: 28, revealed: false },
      { text: "مال/بطاقة ائتمان", points: 20, revealed: false },
      { text: "أدوية", points: 9, revealed: false },
      { text: "كاميرا", points: 6, revealed: false },
    ],
  },
  {
    question: "ما أكثر ما يزعجك بالصور؟",
    answers: [
      { text: "شعرك", points: 28, revealed: false },
      { text: "الخلفية الفوضوية", points: 24, revealed: false },
      { text: "شيء في أسنانك", points: 20, revealed: false },
      { text: "شكلك المتعب", points: 16, revealed: false },
      { text: "الإضاءة الغريبة", points: 12, revealed: false },
    ],
  },
  {
    question: "ماذا يقول المصور عادة؟",
    answers: [
      { text: "الجميع يبتسموا!", points: 30, revealed: false },
      { text: "ليش تومض عيونك؟", points: 25, revealed: false },
      { text: "اثبت!", points: 20, revealed: false },
      { text: "ما تسوي وجه غريب!", points: 15, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تفعله عندما تضيع هاتفك؟",
    answers: [
      { text: "اتصل به", points: 34, revealed: false },
      { text: "تفقد جيوبك", points: 24, revealed: false },
      { text: "تتبع خطواتك", points: 20, revealed: false },
      { text: "استخدم تطبيق البحث", points: 14, revealed: false },
    ],
  },
  {
    question: "ما أشياء عديمة الفائدة تجدها في كل بيت؟",
    answers: [
      { text: "بطاريات", points: 28, revealed: false },
      { text: "شواحن قديمة", points: 22, revealed: false },
      { text: "شريط لاصق", points: 18, revealed: false },
      { text: "مفاتيح قديمة", points: 16, revealed: false },
      { text: "أكياس بلاستيك", points: 16, revealed: false },
    ],
  },
  // --- Additional 30+ translated questions ---
  {
    question: "اذكر رياضة تلعب بكرة:",
    answers: [
      { text: "كرة القدم", points: 45, revealed: false },
      { text: "كرة السلة", points: 25, revealed: false },
      { text: "التنس", points: 15, revealed: false },
      { text: "كرة الطائرة", points: 10, revealed: false },
      { text: "كرة اليد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشتريه يأتي في علبة محكمة الإغلاق:",
    answers: [
      { text: "المشروبات الغازية", points: 35, revealed: false },
      { text: "الحساء", points: 25, revealed: false },
      { text: "الفاصوليا", points: 20, revealed: false },
      { text: "التونة", points: 15, revealed: false },
      { text: "الفواكه المعلبة", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً يجعل الناس يسافرون لدبي:",
    answers: [
      { text: "التسوق", points: 30, revealed: false },
      { text: "برج خليفة", points: 25, revealed: false },
      { text: "الأماكن الترفيهية", points: 20, revealed: false },
      { text: "الشواطئ", points: 15, revealed: false },
      { text: "العمل", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً قد تجده في المرآب:",
    answers: [
      { text: "سيارة", points: 40, revealed: false },
      { text: "أدوات", points: 25, revealed: false },
      { text: "دراجة", points: 15, revealed: false },
      { text: "صناديق قديمة", points: 12, revealed: false },
      { text: "مجرفة", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة تعني 'سريع':",
    answers: [
      { text: "سريع", points: 45, revealed: false },
      { text: "عاجل", points: 20, revealed: false },
      { text: "سريع البرق", points: 15, revealed: false },
      { text: "فوري", points: 12, revealed: false },
      { text: "خاطف", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر بطل خارق:",
    answers: [
      { text: "سبايدرمان", points: 30, revealed: false },
      { text: "باتمان", points: 25, revealed: false },
      { text: "سوبرمان", points: 20, revealed: false },
      { text: "آيرون مان", points: 15, revealed: false },
      { text: "كابتن أمريكا", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفهمه الكلب:",
    answers: [
      { text: "اسمه", points: 40, revealed: false },
      { text: "لا", points: 25, revealed: false },
      { text: "تعال", points: 20, revealed: false },
      { text: "اجلس", points: 10, revealed: false },
      { text: "لغة الجسد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يحب الأطفال القفز عليه:",
    answers: [
      { text: "سرير", points: 35, revealed: false },
      { text: "مخدة", points: 25, revealed: false },
      { text: "ترامبولين", points: 20, revealed: false },
      { text: "أرجوحة", points: 12, revealed: false },
      { text: "ماء", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشربه عندما تعطش:",
    answers: [
      { text: "ماء", points: 55, revealed: false },
      { text: "كولا", points: 20, revealed: false },
      { text: "عصير", points: 15, revealed: false },
      { text: "شاي", points: 5, revealed: false },
      { text: "حليب", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر عطلة يتناول الناس فيها الكثير من الطعام:",
    answers: [
      { text: "عيد الفطر", points: 40, revealed: false },
      { text: "عيد الأضحى", points: 30, revealed: false },
      { text: "رمضان", points: 15, revealed: false },
      { text: "العرس", points: 10, revealed: false },
      { text: "عيد الميلاد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس في أول لقاء:",
    answers: [
      { text: "السينما", points: 30, revealed: false },
      { text: "العشاء", points: 25, revealed: false },
      { text: "المشي", points: 20, revealed: false },
      { text: "التحدث", points: 15, revealed: false },
      { text: "القهوة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر دولة مشهورة بطعامها:",
    answers: [
      { text: "إيطاليا", points: 35, revealed: false },
      { text: "فرنسا", points: 25, revealed: false },
      { text: "الهند", points: 15, revealed: false },
      { text: "اليابان", points: 15, revealed: false },
      { text: "المكسيك", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يصعب فتحه:",
    answers: [
      { text: "علبة مخلل", points: 30, revealed: false },
      { text: "برطمان مربى", points: 25, revealed: false },
      { text: "قفل", points: 20, revealed: false },
      { text: "حزمة بلاستيك", points: 15, revealed: false },
      { text: "صدف البحر", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً لا يجب فعله أثناء القيادة:",
    answers: [
      { text: "استخدام الهاتف", points: 40, revealed: false },
      { text: "النوم", points: 20, revealed: false },
      { text: "الأكل", points: 15, revealed: false },
      { text: "موسيقى صاخبة", points: 15, revealed: false },
      { text: "التحدث كثيراً", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً قد يؤدي للتأخر:",
    answers: [
      { text: "الزحام", points: 30, revealed: false },
      { text: "النوم", points: 25, revealed: false },
      { text: "مشكلة بالسيارة", points: 20, revealed: false },
      { text: "الطقس", points: 15, revealed: false },
      { text: "نسيان شيء", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يجعل الطفل يتوقف عن البكاء:",
    answers: [
      { text: "حليب", points: 35, revealed: false },
      { text: "حضن", points: 25, revealed: false },
      { text: "لعبة", points: 20, revealed: false },
      { text: "أغنية", points: 12, revealed: false },
      { text: "تهدئة", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تذهب إليه في يوم حار:",
    answers: [
      { text: "الشاطئ", points: 35, revealed: false },
      { text: "المسبح", points: 30, revealed: false },
      { text: "مركز تسوق", points: 15, revealed: false },
      { text: "مكيف", points: 12, revealed: false },
      { text: "مقهى بارد", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً قد يصادره المعلم:",
    answers: [
      { text: "الهاتف", points: 45, revealed: false },
      { text: "ألعاب", points: 20, revealed: false },
      { text: "مجلة", points: 15, revealed: false },
      { text: "سماعات", points: 12, revealed: false },
      { text: "طعام", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخاف منه الناس في الظلام:",
    answers: [
      { text: "العفاريت", points: 30, revealed: false },
      { text: "اللصوص", points: 25, revealed: false },
      { text: "الأصوات", points: 20, revealed: false },
      { text: "العناكب", points: 15, revealed: false },
      { text: "القطط السوداء", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً ترتبط به مصاصي الدماء:",
    answers: [
      { text: "الثوم", points: 30, revealed: false },
      { text: "الصليب الخشبي", points: 25, revealed: false },
      { text: "الدم", points: 20, revealed: false },
      { text: "الأنياب", points: 15, revealed: false },
      { text: "الخفاش", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر مهنة يعرفها الجميع:",
    answers: [
      { text: "طبيب", points: 35, revealed: false },
      { text: "معلم", points: 25, revealed: false },
      { text: "مهندس", points: 20, revealed: false },
      { text: "محامي", points: 12, revealed: false },
      { text: "شرطي", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر طعاماً لزجاً:",
    answers: [
      { text: "عسل", points: 35, revealed: false },
      { text: "فول سوداني", points: 25, revealed: false },
      { text: "كراميل", points: 20, revealed: false },
      { text: "تمر", points: 12, revealed: false },
      { text: "جلي", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله كل صباح:",
    answers: [
      { text: "الاستيقاظ", points: 30, revealed: false },
      { text: "شرب قهوة", points: 25, revealed: false },
      { text: "الاستحمام", points: 20, revealed: false },
      { text: "الإفطار", points: 15, revealed: false },
      { text: "فحص الهاتف", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر لوناً لا تود رؤيته في طعامك:",
    answers: [
      { text: "أخضر", points: 35, revealed: false },
      { text: "أسود", points: 25, revealed: false },
      { text: "أزرق", points: 20, revealed: false },
      { text: "رمادي", points: 12, revealed: false },
      { text: "بني غامق", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يستخدم الكهرباء:",
    answers: [
      { text: "التلفزيون", points: 25, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "الثلاجة", points: 20, revealed: false },
      { text: "المكيف", points: 15, revealed: false },
      { text: "الغسالة", points: 10, revealed: false },
      { text: "المصباح", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً للاتصال بالشرطة:",
    answers: [
      { text: "سرقة", points: 35, revealed: false },
      { text: "حادث", points: 25, revealed: false },
      { text: "شجار", points: 20, revealed: false },
      { text: "ضجيج", points: 12, revealed: false },
      { text: "شكوى", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر واجباً منزلياً لا يحبه أحد:",
    answers: [
      { text: "غسل الأطباق", points: 35, revealed: false },
      { text: "تنظيف الحمام", points: 30, revealed: false },
      { text: "كنس الأرض", points: 15, revealed: false },
      { text: "تعليق الغسيل", points: 10, revealed: false },
      { text: "تنظيف الفرن", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الذي يضعه الناس على البيتزا؟",
    answers: [
      { text: "بيبروني", points: 50, revealed: false },
      { text: "فطر", points: 20, revealed: false },
      { text: "سجق", points: 15, revealed: false },
      { text: "فلفل أخضر", points: 15, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الناس عندما يبقون في المنزل؟",
    answers: [
      { text: "مشاهدة التلفزيون", points: 40, revealed: false },
      { text: "لعب ألعاب فيديو", points: 30, revealed: false },
      { text: "قراءة كتاب", points: 15, revealed: false },
      { text: "أخذ قيلولة", points: 15, revealed: false },
    ],
  },
  {
    question: "إذا كنت تنام وسمعت صوتاً في الليل، ما هو؟",
    answers: [
      { text: "خطوات", points: 34, revealed: false },
      { text: "صرير الباب", points: 28, revealed: false },
      { text: "كسر زجاج", points: 18, revealed: false },
      { text: "نباح كلب", points: 12, revealed: false },
      { text: "صوت مجهول", points: 8, revealed: false },
    ],
  },
  // === Additional 15 questions ===
  {
    question: "ما أكثر شي يخليك تضحك؟",
    category: "ترفيه", categoryIcon: "😂",
    answers: [
      { text: "مقاطع فيديوهات", points: 30, revealed: false },
      { text: "نكتة صديق", points: 25, revealed: false },
      { text: "أطفال يلعبون", points: 20, revealed: false },
      { text: "وقوع شخص", points: 15, revealed: false },
      { text: "تصرف غريب", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يزعج الناس؟",
    category: "حياة يومية", categoryIcon: "😤",
    answers: [
      { text: "الدوام", points: 25, revealed: false },
      { text: "زحمة السير", points: 22, revealed: false },
      { text: "الأطفال يبكون", points: 18, revealed: false },
      { text: "الانتظار في الطابور", points: 15, revealed: false },
      { text: "البرود", points: 12, revealed: false },
      { text: "صوت المنبه", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله في الحمام:",
    category: "منزل", categoryIcon: "🚿",
    answers: [
      { text: "الاستحمام", points: 40, revealed: false },
      { text: "غسل الأسنان", points: 22, revealed: false },
      { text: "غسل الشعر", points: 15, revealed: false },
      { text: "النظر في المرآة", points: 12, revealed: false },
      { text: "التغني", points: 11, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تشوفه الصباح؟",
    category: "حياة يومية", categoryIcon: "☀️",
    answers: [
      { text: "الموبايل", points: 45, revealed: false },
      { text: "الساعة", points: 20, revealed: false },
      { text: "العائلة", points: 15, revealed: false },
      { text: "النافذة", points: 10, revealed: false },
      { text: "السقف", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر أكلة يحبها الأطفال؟",
    category: "طعام", categoryIcon: "🍕",
    answers: [
      { text: "البيتزا", points: 35, revealed: false },
      { text: "البرجر", points: 25, revealed: false },
      { text: "النودلز", points: 18, revealed: false },
      { text: "الدجاج المقلي", points: 12, revealed: false },
      { text: "الآيس كريم", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أغنية يحفظها الكل؟",
    category: "ترفيه", categoryIcon: "🎵",
    answers: [
      { text: "أغنية طلال مداح", points: 20, revealed: false },
      { text: "أغنية عيد ميلاد", points: 18, revealed: false },
      { text: "أنشودة بلادي", points: 15, revealed: false },
      { text: "أغنية الاطفال", points: 12, revealed: false },
      { text: "أغنية رياضية", points: 10, revealed: false },
      { text: "أغنية تخرج", points: 8, revealed: false },
    ],
  },
  {
    question: "ما أكثر لعبة يحبها اللي يشاهدون الكورة؟",
    category: "رياضة", categoryIcon: "⚽",
    answers: [
      { text: "فيفا", points: 35, revealed: false },
      { text: "ببجي", points: 25, revealed: false },
      { text: "كاونتر سترايك", points: 15, revealed: false },
      { text: "كرة القدم", points: 15, revealed: false },
      { text: "كول أوف ديوتي", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيء تقدر تسويه بيد واحدة:",
    answers: [
      { text: "تأكل", points: 30, revealed: false },
      { text: "تكتب رسالة", points: 25, revealed: false },
      { text: "تغسل وجهك", points: 20, revealed: false },
      { text: "تلبس ثياب", points: 15, revealed: false },
      { text: "تمشط شعرك", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر مكان ينام فيه الناس؟",
    category: "منزل", categoryIcon: "🛏️",
    answers: [
      { text: "السرير", points: 50, revealed: false },
      { text: "الأريكة", points: 20, revealed: false },
      { text: "السجاد", points: 15, revealed: false },
      { text: "السيارة", points: 10, revealed: false },
      { text: "العمل", points: 5, revealed: false },
    ],
  },
  {
    question: "ما شيء لونه أخضر ويحبه الناس؟",
    category: "طبيعة", categoryIcon: "🌿",
    answers: [
      { text: "النباتات", points: 35, revealed: false },
      { text: "الطبيعة", points: 25, revealed: false },
      { text: "الأعشاب", points: 20, revealed: false },
      { text: "الأخضر", points: 10, revealed: false },
      { text: "البطيخ", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر مشروب يطلبه الناس؟",
    category: "طعام", categoryIcon: "🥤",
    answers: [
      { text: "الماء", points: 30, revealed: false },
      { text: "القهوة", points: 25, revealed: false },
      { text: "الشاي", points: 20, revealed: false },
      { text: "العصير", points: 15, revealed: false },
      { text: "المشروب الغازي", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر لعبة يلعبها الأطفال؟",
    category: "ترفيه", categoryIcon: "🎮",
    answers: [
      { text: "الاختباء", points: 25, revealed: false },
      { text: "كرة القدم", points: 20, revealed: false },
      { text: "الدمبل", points: 15, revealed: false },
      { text: "ألعاب الموبايل", points: 15, revealed: false },
      { text: "الرسم", points: 12, revealed: false },
      { text: "الحب", points: 8, revealed: false },
    ],
  },
  {
    question: "ما شيء تخلعه في جيبك دائما؟",
    category: "حياة يومية", categoryIcon: "👔",
    answers: [
      { text: "الموبايل", points: 50, revealed: false },
      { text: "المحفظة", points: 20, revealed: false },
      { text: "المفاتيح", points: 15, revealed: false },
      { text: "نقود", points: 10, revealed: false },
      { text: "منديل", points: 5, revealed: false },
    ],
  },
  {
    question: "ما شيء يخليك يومك أفضل؟",
    category: "حياة يومية", categoryIcon: "✨",
    answers: [
      { text: "النوم الكافي", points: 30, revealed: false },
      { text: "لقاء الأصدقاء", points: 25, revealed: false },
      { text: "الأكل الجيد", points: 20, revealed: false },
      { text: "مشاهدة فيديو مضحك", points: 15, revealed: false },
      { text: "الرياضة", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر تطبيق يستخدمه الناس؟",
    category: "تقنية", categoryIcon: "📱",
    answers: [
      { text: "واتساب", points: 45, revealed: false },
      { text: "تيك توك", points: 25, revealed: false },
      { text: "انستقرام", points: 15, revealed: false },
      { text: "سناب شات", points: 10, revealed: false },
      { text: "تويتر", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً لا تستطيع العيش بدونه:",
    category: "حياة يومية", categoryIcon: "❤️",
    answers: [
      { text: "الموبايل", points: 40, revealed: false },
      { text: "العائلة", points: 30, revealed: false },
      { text: "الماء", points: 15, revealed: false },
      { text: "الأكل", points: 10, revealed: false },
      { text: "النوم", points: 5, revealed: false },
    ],
  },
  // --- 25 new culturally relevant Arabic questions (Task 15-a) ---
  {
    question: "اذكر تطبيقاً لا تستطيع العيش بدونه:",
    category: "تكنولوجيا", categoryIcon: "📱",
    answers: [
      { text: "واتساب", points: 38, revealed: false },
      { text: "تيك توك", points: 22, revealed: false },
      { text: "انستقرام", points: 18, revealed: false },
      { text: "يوتيوب", points: 12, revealed: false },
      { text: "سناب شات", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس في المطعم:",
    category: "حياة يومية", categoryIcon: "🍽️",
    answers: [
      { text: "يطلب قهوة", points: 28, revealed: false },
      { text: "يصور الطعام", points: 25, revealed: false },
      { text: "ينتظر طاولة", points: 20, revealed: false },
      { text: "يحسب الحسبة", points: 15, revealed: false },
      { text: "يتكلم بالموبايل", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً لعدم الذهاب للعمل:",
    category: "عمل", categoryIcon: "💼",
    answers: [
      { text: "مريض", points: 32, revealed: false },
      { text: "تعب", points: 25, revealed: false },
      { text: "زحمة", points: 18, revealed: false },
      { text: "نسيان المنبه", points: 15, revealed: false },
      { text: "اجازة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر نوعاً من أنواع الشوكولاتة:",
    category: "طعام", categoryIcon: "🍫",
    answers: [
      { text: "جالاكسي", points: 28, revealed: false },
      { text: "كيت كات", points: 25, revealed: false },
      { text: "تويكس", points: 20, revealed: false },
      { text: "سنكرز", points: 15, revealed: false },
      { text: "مارس", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً يتجمع فيه الشباب:",
    category: "حياة يومية", categoryIcon: "👥",
    answers: [
      { text: "المول", points: 30, revealed: false },
      { text: "الكافيه", points: 28, revealed: false },
      { text: "الملعب", points: 18, revealed: false },
      { text: "الشاطئ", points: 14, revealed: false },
      { text: "الحديقة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخبئه الأطفال عن والديهم:",
    category: "عائلة", categoryIcon: "👶",
    answers: [
      { text: "الحلوى", points: 35, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "الألعاب", points: 20, revealed: false },
      { text: "علامات المدرسة", points: 20, revealed: false },
    ],
  },
  {
    question: "اذكر لعبة كان يلعبها آباؤنا:",
    category: "ترفيه", categoryIcon: "🎮",
    answers: [
      { text: "الطابة", points: 30, revealed: false },
      { text: "الحجلة", points: 25, revealed: false },
      { text: "الدحية", points: 20, revealed: false },
      { text: "كرة القدم", points: 15, revealed: false },
      { text: "السيجا", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشتريه من السوق:",
    category: "حياة يومية", categoryIcon: "🛒",
    answers: [
      { text: "خضار", points: 28, revealed: false },
      { text: "فواكه", points: 25, revealed: false },
      { text: "لحم", points: 20, revealed: false },
      { text: "سمك", points: 15, revealed: false },
      { text: "خبز", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر نوعاً من أنواع الرز:",
    category: "طعام", categoryIcon: "🍚",
    answers: [
      { text: "بسمتي", points: 30, revealed: false },
      { text: "مشعري", points: 25, revealed: false },
      { text: "كابوري", points: 18, revealed: false },
      { text: "بني", points: 15, revealed: false },
      { text: "أبيض", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر مشروباً يحبه الخليجيون:",
    category: "طعام", categoryIcon: "☕",
    answers: [
      { text: "الشاي", points: 30, revealed: false },
      { text: "القهوة", points: 25, revealed: false },
      { text: "الكرك", points: 20, revealed: false },
      { text: "اللبن", points: 15, revealed: false },
      { text: "العصير", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تضعه في السيارة:",
    category: "حياة يومية", categoryIcon: "🚗",
    answers: [
      { text: "عطر", points: 28, revealed: false },
      { text: "ماء", points: 22, revealed: false },
      { text: "نظارات شمسية", points: 18, revealed: false },
      { text: "جوال", points: 17, revealed: false },
      { text: "شاحن", points: 15, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً لسرعة غضب الشخص:",
    category: "علاقات", categoryIcon: "😤",
    answers: [
      { text: "جوع", points: 30, revealed: false },
      { text: "تعب", points: 22, revealed: false },
      { text: "مضايقة", points: 20, revealed: false },
      { text: "حرارة الجو", points: 16, revealed: false },
      { text: "ضجيج", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر ماركة هاتف مشهورة:",
    category: "تكنولوجيا", categoryIcon: "📲",
    answers: [
      { text: "آيفون", points: 35, revealed: false },
      { text: "سامسونج", points: 30, revealed: false },
      { text: "هواوي", points: 15, revealed: false },
      { text: "شاومي", points: 12, revealed: false },
      { text: "نوكيا", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يحدث في رمضان:",
    category: "علاقات", categoryIcon: "🌙",
    answers: [
      { text: "إفطار", points: 25, revealed: false },
      { text: "صلاة التراويح", points: 22, revealed: false },
      { text: "سحور", points: 18, revealed: false },
      { text: "خيمة رمضان", points: 18, revealed: false },
      { text: "مسلسلات", points: 17, revealed: false },
    ],
  },
  {
    question: "اذكر رياضة مشهورة في العالم العربي:",
    category: "رياضة", categoryIcon: "⚽",
    answers: [
      { text: "كرة القدم", points: 50, revealed: false },
      { text: "كرة السلة", points: 15, revealed: false },
      { text: "التنس", points: 12, revealed: false },
      { text: "السباحة", points: 13, revealed: false },
      { text: "الكاراتيه", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله في الاستراحة:",
    category: "عمل", categoryIcon: "☕",
    answers: [
      { text: "تشرب قهوة", points: 30, revealed: false },
      { text: "تتكلم مع زميل", points: 25, revealed: false },
      { text: "تستخدم الجوال", points: 25, revealed: false },
      { text: "تأكل", points: 20, revealed: false },
    ],
  },
  {
    question: "اذكر بلداً عربياً مشهوراً بالسياحة:",
    category: "سفر", categoryIcon: "✈️",
    answers: [
      { text: "مصر", points: 28, revealed: false },
      { text: "الإمارات", points: 25, revealed: false },
      { text: "تونس", points: 18, revealed: false },
      { text: "المغرب", points: 17, revealed: false },
      { text: "الأردن", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر نوعاً من الملابس الرجالية:",
    category: "حياة يومية", categoryIcon: "👔",
    answers: [
      { text: "ثوب", points: 30, revealed: false },
      { text: "بشت", points: 22, revealed: false },
      { text: "غترة", points: 20, revealed: false },
      { text: "شماغ", points: 16, revealed: false },
      { text: "جيب", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تقدمه للضيف:",
    category: "علاقات", categoryIcon: "🫖",
    answers: [
      { text: "قهوة", points: 30, revealed: false },
      { text: "شاي", points: 25, revealed: false },
      { text: "تمور", points: 22, revealed: false },
      { text: "حلويات", points: 15, revealed: false },
      { text: "ماء", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر برنامجاً تلفزيونياً كان يحبه الجميع:",
    category: "ترفيه", categoryIcon: "📺",
    answers: [
      { text: "خشمك يا بختكار", points: 28, revealed: false },
      { text: "تلفزيون الواقع", points: 22, revealed: false },
      { text: "الأفلام", points: 20, revealed: false },
      { text: "المسلسلات التركية", points: 18, revealed: false },
      { text: "برامج الكوميديا", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر أداة مطبخ أساسية:",
    category: "طعام", categoryIcon: "🍳",
    answers: [
      { text: "القدر", points: 28, revealed: false },
      { text: "المقلاة", points: 25, revealed: false },
      { text: "السكين", points: 20, revealed: false },
      { text: "المطبقة", points: 15, revealed: false },
      { text: "الخلاط", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفقد شكله بسرعة:",
    category: "حياة يومية", categoryIcon: "🫧",
    answers: [
      { text: "الآيس كريم", points: 30, revealed: false },
      { text: "البالون", points: 28, revealed: false },
      { text: "الثلج", points: 22, revealed: false },
      { text: "الزهور", points: 12, revealed: false },
      { text: "البخور", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة يقولها الناس كثيراً:",
    category: "علاقات", categoryIcon: "💬",
    answers: [
      { text: "إن شاء الله", points: 30, revealed: false },
      { text: "ماشاء الله", points: 25, revealed: false },
      { text: "يلا", points: 20, revealed: false },
      { text: "لا", points: 15, revealed: false },
      { text: "شكراً", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر مادة دراسية كان يكرهها التلاميذ:",
    category: "عمل", categoryIcon: "📚",
    answers: [
      { text: "الرياضيات", points: 35, revealed: false },
      { text: "الفيزياء", points: 22, revealed: false },
      { text: "الكيمياء", points: 18, revealed: false },
      { text: "التاريخ", points: 15, revealed: false },
      { text: "اللغة الإنجليزية", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً للسهر:",
    category: "ترفيه", categoryIcon: "🦉",
    answers: [
      { text: "سهرات", points: 25, revealed: false },
      { text: "ألعاب", points: 22, revealed: false },
      { text: "فيلم", points: 20, revealed: false },
      { text: "دراسة", points: 18, revealed: false },
      { text: "سفر", points: 15, revealed: false },
    ],
  },
  // --- Questions adapted from prepscholar.com for Arab culture ---
  {
    question: "أين يُطلب منك استخدام صوتك الهادئ؟",
    category: "أماكن", categoryIcon: "📚",
    answers: [
      { text: "المكتبة", points: 30, revealed: false },
      { text: "المسجد", points: 25, revealed: false },
      { text: "المستشفى", points: 20, revealed: false },
      { text: "السينما", points: 15, revealed: false },
      { text: "الفصل الدراسي", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا تجد في بيت مسكون؟",
    category: "مخاوف", categoryIcon: "👻",
    answers: [
      { text: "أشباح", points: 30, revealed: false },
      { text: "عناكب", points: 20, revealed: false },
      { text: "فئران", points: 18, revealed: false },
      { text: "أصوات غريبة", points: 17, revealed: false },
      { text: "غبار", points: 15, revealed: false },
    ],
  },
  {
    question: "ماذا تفعل قبل النوم؟",
    category: "حياة يومية", categoryIcon: "🌙",
    answers: [
      { text: "غسل الأسنان", points: 23, revealed: false },
      { text: "فحص الهاتف", points: 22, revealed: false },
      { text: "قراءة القرآن", points: 20, revealed: false },
      { text: "الاستحمام", points: 20, revealed: false },
      { text: "إطفاء الأنوار", points: 15, revealed: false },
    ],
  },
  {
    question: "ما الذي يجعلك بصحة وقوة؟",
    category: "صحة", categoryIcon: "💪",
    answers: [
      { text: "الرياضة", points: 30, revealed: false },
      { text: "نوم كافي", points: 25, revealed: false },
      { text: "أكل صحي", points: 22, revealed: false },
      { text: "شرب ماء كثير", points: 15, revealed: false },
      { text: "الفيتامينات", points: 8, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الكلب عادة؟",
    category: "حيوانات", categoryIcon: "🐕",
    answers: [
      { text: "ينبح", points: 30, revealed: false },
      { text: "يجري", points: 25, revealed: false },
      { text: "يقفز", points: 20, revealed: false },
      { text: "يعض", points: 15, revealed: false },
      { text: "يلعب", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الأشياء التي تأتي بشكل زوجي؟",
    category: "عام", categoryIcon: "👯",
    answers: [
      { text: "الحذاء", points: 24, revealed: false },
      { text: "الجوارب", points: 22, revealed: false },
      { text: "العيون", points: 20, revealed: false },
      { text: "الأيدي", points: 18, revealed: false },
      { text: "الأذنين", points: 16, revealed: false },
    ],
  },
  {
    question: "ماذا تجد في المطبخ؟",
    category: "منزل", categoryIcon: "🍳",
    answers: [
      { text: "الثلاجة", points: 25, revealed: false },
      { text: "الفرن", points: 22, revealed: false },
      { text: "المقلاة", points: 18, revealed: false },
      { text: "الأطباق", points: 17, revealed: false },
      { text: "حوض الغسيل", points: 18, revealed: false },
    ],
  },
  {
    question: "ماذا تفعل في يوم صيفي حار؟",
    category: "ترفيه", categoryIcon: "☀️",
    answers: [
      { text: "السباحة", points: 30, revealed: false },
      { text: "البقاء في المكيف", points: 25, revealed: false },
      { text: "شرب المشروبات الباردة", points: 20, revealed: false },
      { text: "الذهاب للبحر", points: 15, revealed: false },
      { text: "أكل آيس كريم", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا تفعل بعد تصوير سيلفي؟",
    category: "تكنولوجيا", categoryIcon: "🤳",
    answers: [
      { text: "أضيف فلتر", points: 25, revealed: false },
      { text: "أرسله لصديق", points: 22, revealed: false },
      { text: "أنشره في الانستقرام", points: 20, revealed: false },
      { text: "أحذفه وأصور غيره", points: 18, revealed: false },
      { text: "أرسله بالواتساب", points: 15, revealed: false },
    ],
  },
  {
    question: "ما أكثر أكل يأكله الناس بالإيد؟",
    category: "طعام", categoryIcon: "🍔",
    answers: [
      { text: "شاورما", points: 28, revealed: false },
      { text: "برجر", points: 22, revealed: false },
      { text: "فلافل", points: 20, revealed: false },
      { text: "بيتزا", points: 18, revealed: false },
      { text: "ساندويتش", points: 12, revealed: false },
    ],
  },
  {
    question: "ما سبب عدم الرد على الرسالة؟",
    category: "تكنولوجيا", categoryIcon: "📱",
    answers: [
      { text: "نسيت", points: 28, revealed: false },
      { text: "مشغول", points: 25, revealed: false },
      { text: "ما قرأتها", points: 20, revealed: false },
      { text: "ما أعرف أيش أرد", points: 15, revealed: false },
      { text: "السوشيال ميديا", points: 12, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي ما تطلع من البيت بدونه؟",
    category: "حياة يومية", categoryIcon: "🔑",
    answers: [
      { text: "الجوال", points: 35, revealed: false },
      { text: "المفاتيح", points: 25, revealed: false },
      { text: "المحفظة", points: 20, revealed: false },
      { text: "الماء", points: 12, revealed: false },
      { text: "النعال", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي يشجع الأهل أبنائهم عليه؟",
    category: "عائلة", categoryIcon: "👨‍👩‍👦",
    answers: [
      { text: "الدراسة", points: 30, revealed: false },
      { text: "الصلاة", points: 25, revealed: false },
      { text: "الرياضة", points: 20, revealed: false },
      { text: "قراءة الكتب", points: 15, revealed: false },
      { text: "احترام الآخرين", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي دايم ينفذ من البيت بسرعة؟",
    category: "منزل", categoryIcon: "🏠",
    answers: [
      { text: "الخبز", points: 30, revealed: false },
      { text: "الحليب", points: 25, revealed: false },
      { text: "الماء", points: 18, revealed: false },
      { text: "البيض", points: 15, revealed: false },
      { text: "المناديل", points: 12, revealed: false },
    ],
  },
  {
    question: "كيف كان الناس يتواصلون قبل الجوال؟",
    category: "تكنولوجيا", categoryIcon: "📞",
    answers: [
      { text: "الزيارات", points: 30, revealed: false },
      { text: "الهاتف الأرضي", points: 25, revealed: false },
      { text: "الرسائل الورقية", points: 20, revealed: false },
      { text: "البريد", points: 15, revealed: false },
      { text: "الجيران", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الضيوف في العرس؟",
    category: "مناسبات", categoryIcon: "💒",
    answers: [
      { text: "الرقص", points: 30, revealed: false },
      { text: "الأكل", points: 25, revealed: false },
      { text: "تصوير الفيديو", points: 20, revealed: false },
      { text: "تهنئة العروسين", points: 15, revealed: false },
      { text: "تقديم الهدايا", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أهم رقم يحفظه الناس؟",
    category: "حياة يومية", categoryIcon: "🔢",
    answers: [
      { text: "رقم الجوال", points: 30, revealed: false },
      { text: "رقم البنك/آيبان", points: 25, revealed: false },
      { text: "الرقم السري", points: 20, revealed: false },
      { text: "رقم الأهل", points: 15, revealed: false },
      { text: "رقم الطوارئ", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي يصير مرة كل أربع سنين؟",
    category: "رياضة", categoryIcon: "🏆",
    answers: [
      { text: "كأس العالم", points: 35, revealed: false },
      { text: "الأولمبياد", points: 25, revealed: false },
      { text: "الانتخابات", points: 20, revealed: false },
      { text: "خسوف القمر", points: 12, revealed: false },
      { text: "النهائي العربي", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الموضوع اللي ما تحب يتكلم عنه في العزومات؟",
    category: "علاقات", categoryIcon: "🤐",
    answers: [
      { text: "السياسة", points: 32, revealed: false },
      { text: "الراتب والمال", points: 25, revealed: false },
      { text: "مشاكل عائلية", points: 20, revealed: false },
      { text: "موضوع الزواج", points: 13, revealed: false },
      { text: "الدين", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي دايم يكون في المطبخ ولا ينفد؟",
    category: "طعام", categoryIcon: "🧂",
    answers: [
      { text: "الأرز", points: 30, revealed: false },
      { text: "الزيت", points: 25, revealed: false },
      { text: "البهارات", points: 20, revealed: false },
      { text: "الملح", points: 15, revealed: false },
      { text: "البصل", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الناس لما يرون حشرة؟",
    category: "حياة يومية", categoryIcon: "🐛",
    answers: [
      { text: "يصرخون", points: 30, revealed: false },
      { text: "يبتعدون", points: 25, revealed: false },
      { text: "يقتلونها", points: 22, revealed: false },
      { text: "يطلبون مساعدة", points: 15, revealed: false },
      { text: "يصورونها", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يزعجك في المطعم:",
    category: "حياة يومية", categoryIcon: "🍽️",
    answers: [
      { text: "الخدمة البطيئة", points: 30, revealed: false },
      { text: "الطعام البارد", points: 25, revealed: false },
      { text: "الضجيج", points: 20, revealed: false },
      { text: "الحسبة الغالية", points: 15, revealed: false },
      { text: "نظافة المكان", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر شي يخلي الواحد يحس بالملل؟",
    category: "حياة يومية", categoryIcon: "😴",
    answers: [
      { text: "الانتظار", points: 28, revealed: false },
      { text: "الجلوس بدون ما يفعل شي", points: 25, revealed: false },
      { text: "الاجتماعات الطويلة", points: 20, revealed: false },
      { text: "الرحلات الطويلة", points: 17, revealed: false },
      { text: "عدم وجود إنترنت", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر فاكهة يحبها الكل:",
    category: "طعام", categoryIcon: "🍎",
    answers: [
      { text: "التمر", points: 30, revealed: false },
      { text: "المانجو", points: 25, revealed: false },
      { text: "البرتقال", points: 18, revealed: false },
      { text: "التفاح", points: 15, revealed: false },
      { text: "البطيخ", points: 12, revealed: false },
    ],
  },
  {
    question: "ما أول شيء يخطر في بالك لما تسمع كلمة 'مطار'؟",
    category: "سفر", categoryIcon: "✈️",
    answers: [
      { text: "سفر", points: 32, revealed: false },
      { text: "تأخير", points: 25, revealed: false },
      { text: "جواز سفر", points: 20, revealed: false },
      { text: "حقائب", points: 13, revealed: false },
      { text: "فحص الأمن", points: 10, revealed: false },
    ],
  },
];

// Fast Money questions (separate set)
export const FAST_MONEY_QUESTIONS: Question[] = [
  {
    question: "شيء أحمر في البيت:",
    answers: [
      { text: "السجادة", points: 25, revealed: false },
      { text: "المخدة", points: 20, revealed: false },
      { text: "المايكرويف", points: 18, revealed: false },
      { text: "المفتاح", points: 17, revealed: false },
      { text: "الطفاية", points: 12, revealed: false },
      { text: "وسادة", points: 8, revealed: false },
    ],
  },
  {
    question: "شيء يبدأ بحرف الميم:",
    answers: [
      { text: "محمد", points: 30, revealed: false },
      { text: "ماء", points: 22, revealed: false },
      { text: "موبايل", points: 20, revealed: false },
      { text: "مدرسة", points: 15, revealed: false },
      { text: "مسجد", points: 13, revealed: false },
    ],
  },
  {
    question: "حيوان تحبه:",
    answers: [
      { text: "القط", points: 28, revealed: false },
      { text: "الكلب", points: 22, revealed: false },
      { text: "الحصان", points: 18, revealed: false },
      { text: "الأرنب", points: 15, revealed: false },
      { text: "الطائر", points: 12, revealed: false },
      { text: "السلاحف", points: 5, revealed: false },
    ],
  },
  {
    question: "لون تحبه:",
    answers: [
      { text: "أزرق", points: 28, revealed: false },
      { text: "أسود", points: 22, revealed: false },
      { text: "أبيض", points: 18, revealed: false },
      { text: "أحمر", points: 17, revealed: false },
      { text: "أخضر", points: 15, revealed: false },
    ],
  },
  {
    question: "شيء تفكر فيه قبل ما تنام:",
    answers: [
      { text: "المستقبل", points: 35, revealed: false },
      { text: "الأكل", points: 22, revealed: false },
      { text: "العائلة", points: 18, revealed: false },
      { text: "المال", points: 15, revealed: false },
      { text: "المشاكل", points: 10, revealed: false },
    ],
  },
  {
    question: "مشروب تحبه:",
    answers: [
      { text: "القهوة", points: 30, revealed: false },
      { text: "الشاي", points: 25, revealed: false },
      { text: "الماء", points: 18, revealed: false },
      { text: "العصير", points: 15, revealed: false },
      { text: "الكولا", points: 12, revealed: false },
    ],
  },
  {
    question: "مادة دراسية:",
    answers: [
      { text: "الرياضيات", points: 28, revealed: false },
      { text: "اللغة العربية", points: 25, revealed: false },
      { text: "الإنجليزي", points: 20, revealed: false },
      { text: "العلوم", points: 17, revealed: false },
      { text: "التربية الإسلامية", points: 10, revealed: false },
    ],
  },
  {
    question: "شيء تفعله في العطلة:",
    answers: [
      { text: "سفر", points: 30, revealed: false },
      { text: "نوم", points: 22, revealed: false },
      { text: "خروج مع الأصدقاء", points: 20, revealed: false },
      { text: "مشاهدة مسلسلات", points: 18, revealed: false },
      { text: "رياضة", points: 10, revealed: false },
    ],
  },
  {
    question: "اسم فريق كرة قدم:",
    answers: [
      { text: "الهلال", points: 25, revealed: false },
      { text: "النصر", points: 25, revealed: false },
      { text: "الأهلي", points: 20, revealed: false },
      { text: "الزمالك", points: 15, revealed: false },
      { text: "الرجاء", points: 15, revealed: false },
    ],
  },
  {
    question: "شيء موجود في كل بيت عربي:",
    answers: [
      { text: "قهوة عربية", points: 30, revealed: false },
      { text: "قرآن", points: 25, revealed: false },
      { text: "تبخير", points: 20, revealed: false },
      { text: "سجادة صلاة", points: 15, revealed: false },
      { text: "صينية تمور", points: 10, revealed: false },
    ],
  },
];

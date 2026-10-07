// كتالوج الهدايا في العميل (يطابق أسعار السيرفر) — الرسوم في gifts.js
window.GIFT_CATALOG = [
  { id: 'rose',    name: 'وردة',        price: 100,      tier: 1, anim: 'rise' },
  { id: 'heart',   name: 'قلب',         price: 500,      tier: 1, anim: 'rise' },
  { id: 'teddy',   name: 'دبدوب',       price: 1000,     tier: 1, anim: 'rise' },
  { id: 'kiss',    name: 'قبلة',        price: 2000,     tier: 1, anim: 'rise' },
  { id: 'moon',    name: 'قمر',         price: 5000,     tier: 2, anim: 'float' },
  { id: 'perfume', name: 'عطر',         price: 8000,     tier: 2, anim: 'float' },
  { id: 'box',     name: 'صندوق هدايا', price: 10000,    tier: 2, anim: 'float' },
  { id: 'crown',   name: 'تاج',         price: 20000,    tier: 3, anim: 'float' },
  { id: 'ring',    name: 'خاتم ألماس',  price: 50000,    tier: 3, anim: 'drop' },
  { id: 'car',     name: 'سيارة فخمة',  price: 100000,   tier: 3, anim: 'drive' },
  { id: 'cup',     name: 'كأس ذهبي',    price: 100000,   tier: 3, anim: 'drop' },
  { id: 'yacht',   name: 'يخت',         price: 500000,   tier: 4, anim: 'drive' },
  { id: 'diamond', name: 'ألماسة',      price: 500000,   tier: 4, anim: 'burst' },
  { id: 'jet',     name: 'طائرة خاصة',  price: 1000000,  tier: 4, anim: 'flyby' },
  { id: 'palace',  name: 'قصر',         price: 2000000,  tier: 4, anim: 'burst' },
  { id: 'rocket',  name: 'صاروخ',       price: 5000000,  tier: 5, anim: 'rocket' },
  { id: 'castle',  name: 'قصر الأحلام', price: 10000000, tier: 5, anim: 'burst' },
];

window.GIFT_TIERS = {
  1: { name: 'عادية', color: '#9E9E9E' },
  2: { name: 'مميزة', color: '#4DD0E1' },
  3: { name: 'نادرة', color: '#BA68C8' },
  4: { name: 'أسطورية', color: '#FFB300' },
  5: { name: 'خارقة', color: '#FF5252' },
};

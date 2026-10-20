import { redirect } from 'next/navigation';

// إعادة توجيه للعبة 2048 standalone
export default function Game2048Page() {
  redirect('/play/standalone/2048');
}

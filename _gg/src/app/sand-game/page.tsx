import { redirect } from 'next/navigation';

// إعادة توجيه للعبة standalone
export default function sand_gamePage() {
  redirect('/play/standalone/sand-game');
}

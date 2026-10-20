import { redirect } from 'next/navigation';

// إعادة توجيه للعبة standalone
export default function wordlePage() {
  redirect('/play/standalone/wordle');
}

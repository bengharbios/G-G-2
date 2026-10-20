import { redirect } from 'next/navigation';

// إعادة توجيه للعبة standalone
export default function trap_the_catPage() {
  redirect('/play/standalone/trap-the-cat');
}

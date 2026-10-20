import { redirect } from 'next/navigation';

// إعادة توجيه للعبة standalone
export default function coreballPage() {
  redirect('/play/standalone/coreball');
}

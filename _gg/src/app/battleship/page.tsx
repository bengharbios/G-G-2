import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: { mode?: string };
}

export default function BattleshipRedirect({ searchParams }: PageProps) {
  const mode = searchParams.mode;
  redirect(mode ? `/matchcards?mode=${mode}` : '/matchcards');
}

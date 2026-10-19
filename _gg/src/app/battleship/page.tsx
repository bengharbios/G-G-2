import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function BattleshipRedirect({ searchParams }: PageProps) {
  const { mode } = await searchParams;
  redirect(mode ? `/matchcards?mode=${mode}` : '/matchcards');
}

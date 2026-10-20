import { redirect } from 'next/navigation';

// /r/foodwar/[code] is a deep-link shortcut — send to /join/foodwar/[code]
export default async function RFoodWarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/join/foodwar/${code}`);
}

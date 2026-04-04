import { getCurrentAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentAuthUser();
  return Response.json({ user });
}

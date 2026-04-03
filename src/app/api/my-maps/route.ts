import { getCurrentAuthUser, listOwnedCloudLevels } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentAuthUser();
  if (!user) {
    return Response.json({ error: 'Sign in with Google to load your cloud maps.' }, { status: 401 });
  }

  try {
    const { levels, warning } = await listOwnedCloudLevels();
    if (warning) {
      return Response.json({ error: warning }, { status: 500 });
    }
    return Response.json({ levels });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load cloud maps.';
    return Response.json({ error: message }, { status: 500 });
  }
}

import { getCurrentAuthUser } from '@/lib/auth';
import { listLevelBestScoresFromSupabase, submitLevelBestScoreToSupabase } from '@/lib/supabase-best-scores';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hashes = url.searchParams
    .getAll('hash')
    .flatMap(value => value.split(','))
    .map(value => value.trim())
    .filter(Boolean);

  try {
    const scores = await listLevelBestScoresFromSupabase(hashes);
    return Response.json({ scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load level best scores.';
    return Response.json({ scores: [], warning: message }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      levelHash?: string;
      moves?: number;
      source?: string | null;
      sourceLevelId?: number | null;
      levelName?: string | null;
    };

    const levelHash = body.levelHash?.trim();
    const moves = Number(body.moves);

    if (!levelHash) {
      return Response.json({ error: 'Missing level hash.' }, { status: 400 });
    }

    if (!Number.isFinite(moves) || moves < 0) {
      return Response.json({ error: 'Invalid move count.' }, { status: 400 });
    }

    const user = await getCurrentAuthUser();
    const result = await submitLevelBestScoreToSupabase({
      levelHash,
      moves,
      source: body.source ?? null,
      sourceLevelId: body.sourceLevelId ?? null,
      levelName: body.levelName ?? null,
      playerUserId: user?.id ?? null,
      playerDisplayName: user?.displayName ?? user?.email ?? null,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save level best score.';
    return Response.json({ error: message }, { status: 500 });
  }
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type OwnedCloudLevelSummary } from '@/lib/auth';
import { MAX_PUBLISHED_COMMUNITY_LEVELS } from '@/lib/community-limits';
import { deleteOwnedCommunityLevelFromApi, setCommunityLevelPublishedInApi } from '@/lib/community-api';

interface MyMapsClientProps {
  initialLevels: OwnedCloudLevelSummary[];
  initialWarning: string | null;
  isAdmin?: boolean;
}

function formatUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) return 'Unknown';
  const value = new Date(updatedAt);
  if (Number.isNaN(value.getTime())) return 'Unknown';
  return value.toLocaleString();
}

export default function MyMapsClient({ initialLevels, initialWarning, isAdmin = false }: MyMapsClientProps) {
  const router = useRouter();
  const [levels, setLevels] = useState(initialLevels);
  const [message, setMessage] = useState<string | null>(initialWarning);
  const [busyId, setBusyId] = useState<number | null>(null);

  const publishedCount = useMemo(
    () => levels.filter(level => level.isPublished).length,
    [levels],
  );

  useEffect(() => {
    function goBackOrHome() {
      router.push('/');
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        goBackOrHome();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  async function handleTogglePublish(level: OwnedCloudLevelSummary) {
    setBusyId(level.id);
    setMessage(null);
    try {
      const next = await setCommunityLevelPublishedInApi(level.id, !level.isPublished);
      setLevels(current => current.map(item => (item.id === next.id ? next : item)));
      setMessage(next.isPublished ? 'Map published to Community.' : 'Map unpublished from Community.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update publication status.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(levelId: number) {
    setBusyId(levelId);
    setMessage(null);
    try {
      await deleteOwnedCommunityLevelFromApi(levelId);
      setLevels(current => current.filter(level => level.id !== levelId));
      setMessage(`Deleted cloud map ${levelId}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete cloud map.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {message && (
        <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
          {message}
        </p>
      )}

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/45">
          {levels.length} cloud map{levels.length === 1 ? '' : 's'} owned
        </p>
        <p className="text-xs text-white/30">
          Published maps: {isAdmin ? `${publishedCount}/unlimited` : `${publishedCount}/${MAX_PUBLISHED_COMMUNITY_LEVELS}`}
        </p>
      </div>

      {levels.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-white/40">
          <p>No cloud maps yet. Open the editor to create your first account-owned map.</p>
          <div className="mt-4">
            <Link
              href="/editor"
              className="inline-flex items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20 transition-all duration-200"
            >
              Open Editor
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {levels.map(level => (
            <div
              key={level.id}
              className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-medium text-white sm:text-lg">{level.name}</p>
                <p className="text-xs text-white/35 sm:text-sm">
                  Community {level.id} - {level.width}x{level.height}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/25">
                  {level.isPublished ? 'Published' : 'Private'} - Updated {formatUpdatedAt(level.updatedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/play/${level.id}`}
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/25 transition-all duration-200"
                >
                  Play
                </Link>
                <Link
                  href={`/editor?communityId=${level.id}`}
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75 hover:border-white/20 hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => void handleTogglePublish(level)}
                  disabled={busyId === level.id}
                  className="inline-flex items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 hover:bg-amber-500/20 transition-all duration-200 disabled:opacity-60"
                >
                  {level.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => void handleDelete(level.id)}
                  disabled={busyId === level.id}
                  className="inline-flex items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/20 transition-all duration-200 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

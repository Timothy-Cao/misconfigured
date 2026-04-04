import AuthControls from '@/components/AuthControls';
import MyMapsClient from '@/components/MyMapsClient';
import { getCurrentAuthUser, listOwnedCloudLevels, isSupabaseAuthReady } from '@/lib/auth';

export default async function MyMapsPage() {
  const authReady = isSupabaseAuthReady();
  const user = await getCurrentAuthUser();
  const { levels, warning } = await listOwnedCloudLevels();

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center p-6 sm:p-8 lg:p-10 relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-cyan-500/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                My Maps
              </h1>
              <p className="mt-1 text-sm text-white/35 sm:text-base">
                Your signed-in cloud collection. Unpublished maps stay private, and published maps appear in Community.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10">
          {!authReady ? (
            <p className="text-sm text-amber-200/85">
              Supabase auth is not configured yet. Add the public auth environment variables to enable Google sign-in.
            </p>
          ) : !user ? (
            <div className="space-y-4">
              <p className="text-white/45">Sign in with Google to view and manage your cloud-owned maps.</p>
              <AuthControls />
            </div>
          ) : (
            <>
              <div className={`mb-5 rounded-2xl border px-4 py-4 text-sm ${
                user.isAdmin
                  ? 'border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-100/85'
                  : 'border-amber-400/20 bg-amber-500/[0.08] text-amber-100/85'
              }`}>
                <p className="font-medium">
                  Signed in as {user.email ?? user.displayName ?? 'your account'}
                </p>
                <p className="mt-1 opacity-80">
                  {user.isAdmin
                    ? 'This account is recognized as an admin and can save campaign overrides.'
                    : 'This account is not recognized as an admin. Campaign override saves will be blocked until the deployment is using your ADMIN_EMAILS value.'}
                </p>
              </div>
              <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.08] px-4 py-4 text-sm text-cyan-100/85">
                <p className="font-medium text-cyan-100">Cloud maps are live.</p>
                <p className="mt-1 text-cyan-100/65">
                  This is your hub for private saves, publishing to Community, and opening maps in the editor.
                </p>
              </div>
              <MyMapsClient initialLevels={levels} initialWarning={warning} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

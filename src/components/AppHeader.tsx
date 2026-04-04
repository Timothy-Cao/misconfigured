'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AuthControls from '@/components/AuthControls';
import { type AuthUserSummary } from '@/lib/auth';

interface AppHeaderProps {
  initialUser?: AuthUserSummary | null;
}

const NAV_ITEMS = [
  { href: '/', label: 'Menu' },
  { href: '/editor', label: 'Editor' },
  { href: '/community', label: 'Community' },
  { href: '/levels', label: 'Campaign' },
  { href: '/my-maps', label: 'My Maps' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader({ initialUser = null }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-3 sm:h-20 sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              aria-label="Home"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg font-black tracking-tight text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.09] sm:h-12 sm:w-12 sm:text-xl"
            >
              <span className="bg-gradient-to-r from-rose-300 via-white to-cyan-300 bg-clip-text text-transparent">
                M
              </span>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'border border-white/15 bg-white/[0.08] text-white'
                        : 'text-white/58 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/75 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.09] md:hidden"
              aria-label="Open navigation menu"
              data-no-global-swipe
            >
              <span className="text-lg leading-none">≡</span>
            </button>
          </div>

          <AuthControls initialUser={initialUser} className="justify-end" />
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" data-no-global-swipe>
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          />
          <div className="absolute left-3 right-3 top-20 rounded-3xl border border-white/10 bg-[#12121a]/96 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/35">
                Navigate
              </p>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 hover:bg-white/[0.08] hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid gap-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${
                      active
                        ? 'border-white/20 bg-white/[0.09] text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

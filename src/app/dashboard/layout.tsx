'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { obtenerPerfilUsuario, type PerfilUsuario } from './perfil/actions';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', iconActive: '🏠' },
  { href: '/dashboard/diagnostico', label: 'Mi Diagnóstico', icon: '📊', iconActive: '📊' },
  { href: '/dashboard/entrenar', label: 'Entrenar', icon: '🧠', iconActive: '🧠' },
  { href: '/dashboard/tutor', label: 'Tutor IA', icon: '🤖', iconActive: '🤖' },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: '👤', iconActive: '👤' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [perfil, setPerfil] = useState<{
    nombre: string;
    iniciales: string;
    cargo_aspira: string;
  }>({ nombre: '...', iniciales: '·', cargo_aspira: '...' });

  useEffect(() => {
    let cancelado = false;
    void obtenerPerfilUsuario()
      .then((data: PerfilUsuario) => {
        if (!cancelado) {
          setPerfil({
            nombre: data.nombre,
            iniciales: data.iniciales,
            cargo_aspira: data.cargo_aspira,
          });
          // Si todos los datos son defaults, el usuario no está autenticado
          if (data.nombre === 'Aspirante' && data.cargo_aspira === 'Por definir') {
            router.push('/login');
          }
        }
      })
      .catch((err) => {
        console.warn('[Layout] perfil:', err);
        router.push('/login');
      });
    return () => {
      cancelado = true;
    };
  }, [router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* ============ SIDEBAR DESKTOP ============ */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 2rem' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--color-text-primary)' }}>
            <span style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Mérito<span style={{ color: 'var(--color-cta)' }}>Pro</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <span style={{ fontSize: '1.125rem' }}>
                      {isActive ? item.iconActive : item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Card */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--color-ia), #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {perfil.iniciales}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {perfil.nombre}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {perfil.cargo_aspira}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header */}
        <header className="dashboard-mobile-header">
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Mérito<span style={{ color: 'var(--color-cta)' }}>Pro</span>
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-ia), #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          >
            CG
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: 'clamp(1rem, 3vw, 2rem)' }}>
          {children}
        </main>
      </div>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="dashboard-bottom-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.25rem' }}>{isActive ? item.iconActive : item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ============ COMPONENT STYLES ============ */}
      <style>{`
        .dashboard-sidebar {
          width: 240px;
          background-color: var(--color-bg-white);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.75rem;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .sidebar-link:hover {
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
        }

        .sidebar-link.active {
          background-color: var(--color-ia-light);
          color: var(--color-ia);
          font-weight: 600;
        }

        .dashboard-mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          background-color: var(--color-bg-white);
          border-bottom: 1px solid var(--color-border);
        }

        .dashboard-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-bg-white);
          border-top: 1px solid var(--color-border);
          z-index: 40;
          padding: 0.375rem 0.5rem;
          padding-bottom: env(safe-area-inset-bottom, 0.375rem);
        }

        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
          text-decoration: none;
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          padding: 0.375rem 0;
          flex: 1;
          transition: color var(--transition-fast);
        }

        .bottom-nav-item.active {
          color: var(--color-ia);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            display: none;
          }

          .dashboard-mobile-header {
            display: flex;
          }

          .dashboard-bottom-nav {
            display: flex;
          }

          main {
            padding-bottom: 5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

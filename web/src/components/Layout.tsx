import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `text-sm font-medium transition-colors ${
    isActive ? 'text-primary font-semibold' : 'text-textSecondary hover:text-primary'
  }`;
}

export function Layout() {
  const { user, isLoggedIn, logout } = useAuth();
  const { itemCount } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  async function handleLogout() {
    setAccountOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">🏬</span>
              <span className="text-lg font-bold text-textPrimary">Sartora</span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/rewards" className={navLinkClass}>
                Rewards
              </NavLink>
              <NavLink to="/faq" className={navLinkClass}>
                FAQ
              </NavLink>
              <NavLink to="/contact" className={navLinkClass}>
                Contact
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="rounded-full p-2 text-textSecondary hover:bg-page"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link
              to="/cart"
              className="relative rounded-full p-2 text-textSecondary hover:bg-page"
              aria-label="Cart"
            >
              🛍️
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                onBlur={() => setTimeout(() => setAccountOpen(false), 150)}
                className="flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium text-textPrimary hover:bg-page"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaryTint text-onPrimaryTint">
                  {isLoggedIn ? user?.name?.[0]?.toUpperCase() ?? '?' : '👤'}
                </span>
                <span className="hidden sm:inline">{isLoggedIn ? user?.name : 'Account'}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-modal">
                  {isLoggedIn ? (
                    <>
                      <Link to="/orders" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        My Orders
                      </Link>
                      <Link to="/wishlist" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        My Wishlist
                      </Link>
                      <Link to="/addresses" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        My Addresses
                      </Link>
                      <Link to="/rewards" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        Rewards & Points
                      </Link>
                      <Link to="/settings" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        Settings
                      </Link>
                      <Link to="/help" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        Help & Support
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-page"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        Sign In
                      </Link>
                      <Link to="/register" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        Create Account
                      </Link>
                      <Link to="/help" className="block px-4 py-2.5 text-sm text-textPrimary hover:bg-page">
                        Help & Support
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              className="rounded-full p-2 text-textSecondary hover:bg-page md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            <Link to="/" className="rounded px-2 py-2 text-sm text-textPrimary hover:bg-page" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/rewards" className="rounded px-2 py-2 text-sm text-textPrimary hover:bg-page" onClick={() => setMenuOpen(false)}>
              Rewards
            </Link>
            <Link to="/faq" className="rounded px-2 py-2 text-sm text-textPrimary hover:bg-page" onClick={() => setMenuOpen(false)}>
              FAQ
            </Link>
            <Link to="/contact" className="rounded px-2 py-2 text-sm text-textPrimary hover:bg-page" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-sm text-textSecondary">
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/faq" className="hover:text-primary">FAQ</Link>
            <Link to="/contact" className="hover:text-primary">Contact Us</Link>
            <Link to="/help" className="hover:text-primary">Help & Support</Link>
          </div>
          <p>© {new Date().getUTCFullYear()} Sartora. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

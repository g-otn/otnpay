import {
  IconHome,
  IconLogin,
  IconLogout,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { clearTokens, isLoggedIn } from '@/features/auth';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  function handleLogout() {
    clearTokens();
    setLoggedIn(false);
    setIsOpen(false);
    void navigate({ to: '/login' });
  }

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          aria-label="Open menu"
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <IconMenu2 size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/">
            <img
              alt="TanStack Logo"
              className="h-10"
              src="/tanstack-word-logo-white.svg"
            />
          </Link>
        </h1>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            aria-label="Close menu"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <IconX size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            onClick={() => setIsOpen(false)}
            to="/"
          >
            <IconHome size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {loggedIn ? (
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2 text-left"
              onClick={handleLogout}
            >
              <IconLogout size={20} />
              <span className="font-medium">Logout</span>
            </button>
          ) : (
            <Link
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              onClick={() => setIsOpen(false)}
              to="/login"
            >
              <IconLogin size={20} />
              <span className="font-medium">Login</span>
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
}

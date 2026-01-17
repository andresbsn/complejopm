import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.rol === 'admin';

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Productos', path: '/productos', icon: '📦', adminOnly: true },
    { name: 'Proveedores', path: '/proveedores', icon: '🏢', adminOnly: true },
    { name: 'Ventas', path: '/ventas', icon: '💰' },
    { name: 'Reportes', path: '/reportes', icon: '📈' },
    // { name: 'Canchas', path: '/canchas', icon: '⚽', adminOnly: true },
    { name: 'Reservas Padel', path: '/reservas/padel', icon: '🎾' },
    { name: 'Reservas Futbol', path: '/reservas/futbol', icon: '🥅' },
    { name: 'Torneos', path: '/torneos', icon: '🏆' },
    { name: 'Jugadores', path: '/jugadores', icon: '👥' },
    { name: 'Caja', path: '/caja', icon: '💸' },
    { name: 'Gastos', path: '/gastos', icon: '💸' },
    { name: 'Configuración', path: '/configuracion', icon: '⚙️', adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          {(isSidebarOpen || isMobileMenuOpen) && (
            <span className="text-xl font-bold text-indigo-600 tracking-tight">
              PM Padel
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 text-gray-500 focus:outline-none"
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 focus:outline-none"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
                {!isSidebarOpen && !isMobileMenuOpen && (
                  <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">{user?.nombre}</p>
                <button 
                    onClick={logout}
                    className="text-xs text-red-500 hover:text-red-700"
                >
                    Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6 z-10">
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 -ml-2 mr-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              ☰
            </button>
            <h1 className="text-lg lg:text-2xl font-semibold text-gray-800 truncate">
              {navItems.find((item) => item.path === location.pathname)?.name ||
                'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              🔔
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              ⚙️
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

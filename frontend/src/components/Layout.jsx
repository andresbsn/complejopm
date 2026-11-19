import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard', section: 'General' },
    { name: 'Productos', path: '/productos', icon: 'box', adminOnly: true, section: 'Administración' },
    { name: 'Proveedores', path: '/proveedores', icon: 'building', adminOnly: true, section: 'Administración' },
    { name: 'Ventas', path: '/ventas', icon: 'money', section: 'Operación' },
    { name: 'Reportes', path: '/reportes', icon: 'chart', section: 'Finanzas' },
    { name: 'Reservas Pádel', path: '/reservas/padel', icon: 'tennis', section: 'Operación' },
    { name: 'Reservas Fútbol', path: '/reservas/futbol', icon: 'football', section: 'Operación' },
    { name: 'Torneos', path: '/torneos', icon: 'trophy', section: 'Operación' },
    { name: 'Jugadores', path: '/jugadores', icon: 'users', section: 'Operación' },
    { name: 'Caja', path: '/caja', icon: 'cash', section: 'Finanzas' },
    { name: 'Gastos', path: '/gastos', icon: 'money', section: 'Finanzas' },
    { name: 'Configuración', path: '/configuracion', icon: 'settings', adminOnly: true, section: 'Administración' },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);
  const activeItem = navItems.find(item => item.path === location.pathname)
    || navItems.find(item => item.path !== '/' && location.pathname.startsWith(`${item.path}/`));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white shadow-xl transition-all duration-300 ease-in-out lg:static ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarOpen ? 'w-64' : 'w-20'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Ir al inicio">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-xs font-extrabold tracking-tight text-white shadow-sm ring-1 ring-indigo-200" aria-label="Logo de PM Padel">
              PM
            </span>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="truncate text-base font-extrabold tracking-tight text-indigo-600">PM Padel</span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ui-icon-button hidden lg:inline-flex"
            aria-label={isSidebarOpen ? 'Contraer menú' : 'Expandir menú'}
          >
            <span aria-hidden="true" className="text-xs">{isSidebarOpen ? '◀' : '▶'}</span>
          </button>
          <button onClick={() => setIsMobileMenuOpen(false)} className="ui-icon-button lg:hidden" aria-label="Cerrar menú">
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {navItems.map((item, index) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const showSection = isSidebarOpen && (index === 0 || navItems[index - 1].section !== item.section);
            return (
              <React.Fragment key={item.name}>
                {showSection && (
                  <p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.section}</p>
                )}
                <Link
                  to={item.path}
                  className={`group relative flex min-h-11 items-center rounded-lg px-4 py-3 transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                  {(isSidebarOpen || isMobileMenuOpen) && <span className="ml-3 font-medium">{item.name}</span>}
                  {!isSidebarOpen && !isMobileMenuOpen && (
                    <span className="invisible absolute left-full z-50 ml-6 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-sm text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                      {item.name}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <div className="ml-3 min-w-0 overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-700">{user?.nombre}</p>
                <button onClick={logout} className="text-xs text-red-500 hover:text-red-700">Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex w-full flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 shadow-sm lg:px-6">
          <div className="flex min-w-0 items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="ui-icon-button -ml-2 mr-2 lg:hidden"
              aria-label="Abrir menú"
            >
              <Icon name="menu" size={21} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-widest text-indigo-600 sm:block">PM Padel</p>
              <h1 className="truncate text-lg font-bold text-slate-800 lg:text-xl">{activeItem?.name || 'Dashboard'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden items-center rounded-full border border-slate-100 bg-slate-50 px-3 py-1 sm:flex">
              <span className="mr-2 text-slate-400">●</span>
              <span className="tabular-nums text-sm font-medium text-slate-600">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <button aria-label="Notificaciones" className="ui-icon-button"><Icon name="bell" size={19} /></button>
            <button aria-label="Configuración rápida" className="ui-icon-button"><Icon name="settings" size={19} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

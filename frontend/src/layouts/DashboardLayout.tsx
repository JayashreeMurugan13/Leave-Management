import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, CalendarDays, FileCheck, LogOut, Bell, Home, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const baseNav: Record<string, { name: string; icon: any; href: string }[]> = {
    STUDENT: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'My Leaves', icon: CalendarDays,    href: '/my-leaves' },
    ],
    PROFESSOR: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Approvals', icon: FileCheck,        href: '/approvals' },
      { name: 'My Leaves', icon: CalendarDays,    href: '/my-leaves' },
    ],
    HOD: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Approvals', icon: FileCheck,        href: '/approvals' },
      { name: 'My Leaves', icon: CalendarDays,    href: '/my-leaves' },
    ],
    PRINCIPAL: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'My Leaves', icon: CalendarDays,    href: '/my-leaves' },
    ],
  };

  const currentRole = user?.role || 'STUDENT';
  const navigation = baseNav[currentRole].map(item => ({
    ...item,
    current: location.pathname === item.href,
  }));

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 font-bold text-xl tracking-tight border-b border-brand-800">
        <span>NexusLeave</span>
        <button onClick={handleLogout} className="flex items-center gap-1 text-brand-300 hover:text-white transition-colors text-xs font-medium" title="Back to Login">
          <Home size={15} /><span className="text-xs">Login</span>
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded transition-colors ${
              item.current ? 'bg-primary-600 text-white shadow-sm' : 'text-brand-200 hover:bg-brand-800 hover:text-white'
            }`}>
            <item.icon size={20} className={item.current ? 'text-white' : 'text-brand-300'} />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-brand-800">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-brand-200 hover:text-white w-full hover:bg-brand-800 rounded transition-colors">
          <LogOut size={20} /><span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-brand-50 flex">

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-brand-900 text-white flex-col shadow-xl z-10 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-brand-900 text-white flex flex-col shadow-xl z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile/tablet only */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors p-1">
              <Menu size={22} />
            </button>
            <span className="font-bold text-brand-900 text-lg lg:hidden">NexusLeave</span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button className="text-gray-400 hover:text-primary-600 relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-600 text-[9px] text-white justify-center items-center font-bold">3</span>
              </span>
            </button>
            <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {user?.role} • {user?.department}
                </div>
              </div>
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-primary-100 text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="flex items-center justify-around h-16">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                  item.current ? 'text-primary-600' : 'text-gray-400 hover:text-gray-700'
                }`}>
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            ))}
            <button onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-3 py-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
              <span className="text-[10px] font-medium">Logout</span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  );
};

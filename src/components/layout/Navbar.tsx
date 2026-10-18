import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return location.hash === path.substring(1);
    }
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/hackathons') {
      return location.pathname.startsWith('/hackathons') && 
             !location.pathname.startsWith('/hackathons/new') &&
             !location.pathname.startsWith('/discover');
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinkClass = (active: boolean) =>
    `relative text-[13px] font-sans font-medium tracking-wide uppercase transition-colors duration-200 py-1.5 px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm ${
      active ? 'text-accent' : 'text-text-secondary hover:text-foreground'
    }`;

  const mobileNavLinkClass = (active: boolean) =>
    `block py-3 px-4 font-sans text-sm font-medium tracking-wide uppercase border-b border-border/50 transition-colors ${
      active 
        ? 'text-accent bg-accent/10 border-l-2 border-l-accent' 
        : 'text-text-secondary hover:text-foreground hover:bg-muted/40'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090A0C]/90 border-b border-border backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
        
        {/* Left: Brand */}
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
        >
          <span className="font-bold text-xl sm:text-2xl tracking-tight uppercase transition-colors">
            HACK<span className="text-accent">MATE</span>
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-accent/80 animate-pulse ml-0.5" />
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 relative">
          {user ? (
            <>
              <Link to="/discover" className={navLinkClass(isActive('/discover'))}>
                DISCOVER HACKATHONS
                {isActive('/discover') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/developers" className={navLinkClass(isActive('/developers'))}>
                DEVELOPERS
                {isActive('/developers') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/team-requests" className={navLinkClass(isActive('/team-requests'))}>
                INBOX
                {isActive('/team-requests') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/hackathons" className={navLinkClass(isActive('/hackathons'))}>
                MY HACKATHONS
                {isActive('/hackathons') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
                DASHBOARD
                {isActive('/dashboard') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={navLinkClass(isActive('/'))}>
                HOME
                {isActive('/') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/discover" className={navLinkClass(isActive('/discover'))}>
                DISCOVER HACKATHONS
                {isActive('/discover') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/developers" className={navLinkClass(isActive('/developers'))}>
                DEVELOPERS
                {isActive('/developers') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
              <Link to="/hackathons/new" className={navLinkClass(isActive('/hackathons/new'))}>
                POST A HACKATHON
                {isActive('/hackathons/new') && (
                  <motion.div 
                    layoutId="navbar-indicator" 
                    className="absolute -bottom-[15px] left-0 right-0 h-[2px] bg-accent" 
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }} 
                  />
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Right: Auth / Profile Controls & Hamburger */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link 
                to="/profile"
                className="inline-flex items-center gap-2 text-xs font-sans font-medium tracking-wide uppercase text-foreground border border-border bg-card px-2.5 sm:px-3 py-1.5 hover:border-accent hover:text-white transition-all rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                title="Account / Profile"
              >
                <UserIcon size={12} className="text-accent shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">
                  {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                </span>
              </Link>

              <button 
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-sans font-semibold tracking-wide uppercase text-muted-foreground hover:text-accent transition-colors duration-200 px-2 py-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                title="Log Out"
              >
                <LogOut size={13} />
                <span>LOG OUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link 
                to="/login" 
                className="text-xs font-sans font-semibold tracking-wide uppercase text-text-secondary hover:text-foreground transition-colors px-2 py-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                SIGN IN
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center text-xs font-sans font-semibold tracking-wide uppercase bg-accent text-white px-3.5 py-1.5 hover:bg-hover-red transition-all duration-200 rounded-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                GET STARTED
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden p-1.5 text-foreground hover:text-accent transition-colors border border-border bg-card rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-border bg-[#090A0C]/98 backdrop-blur-lg overflow-hidden"
          >
            <div className="flex flex-col py-1" onClick={() => setMobileMenuOpen(false)}>
              {user ? (
                <>
                  <Link to="/discover" className={mobileNavLinkClass(isActive('/discover'))}>
                    DISCOVER HACKATHONS
                  </Link>
                  <Link to="/developers" className={mobileNavLinkClass(isActive('/developers'))}>
                    DEVELOPERS
                  </Link>
                  <Link to="/team-requests" className={mobileNavLinkClass(isActive('/team-requests'))}>
                    INBOX
                  </Link>
                  <Link to="/hackathons" className={mobileNavLinkClass(isActive('/hackathons'))}>
                    MY HACKATHONS
                  </Link>
                  <Link to="/dashboard" className={mobileNavLinkClass(isActive('/dashboard'))}>
                    DASHBOARD
                  </Link>
                  <Link to="/profile" className={mobileNavLinkClass(isActive('/profile'))}>
                    MY PROFILE ({profile?.full_name || 'ACCOUNT'})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-4 font-sans text-xs font-semibold tracking-wide uppercase text-accent hover:bg-accent/10 border-b border-border/50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={13} />
                    <span>LOG OUT</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/" className={mobileNavLinkClass(isActive('/'))}>
                    HOME
                  </Link>
                  <Link to="/discover" className={mobileNavLinkClass(isActive('/discover'))}>
                    DISCOVER HACKATHONS
                  </Link>
                  <Link to="/developers" className={mobileNavLinkClass(isActive('/developers'))}>
                    DEVELOPERS
                  </Link>
                  <Link to="/hackathons/new" className={mobileNavLinkClass(isActive('/hackathons/new'))}>
                    POST A HACKATHON
                  </Link>
                  <Link to="/login" className={mobileNavLinkClass(isActive('/login'))}>
                    SIGN IN
                  </Link>
                  <Link to="/register" className={mobileNavLinkClass(isActive('/register'))}>
                    GET STARTED
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

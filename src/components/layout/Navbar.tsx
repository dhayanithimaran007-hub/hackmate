import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

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
    return location.pathname === path || 
           (path !== '/hackathons' && path !== '/' && location.pathname.startsWith(`${path}/`)) || 
           (path === '/hackathons' && location.pathname.startsWith('/hackathons') && !location.pathname.startsWith('/discover') && location.pathname !== '/hackathons/new');
  };

  const navLinkClass = (active: boolean) => 
    `relative text-xs lg:text-[13px] font-mono font-bold tracking-wider uppercase transition-colors duration-300 py-2 ${
      active ? 'text-accent' : 'text-foreground hover:text-accent'
    }`;

  const mobileNavLinkClass = (active: boolean) =>
    `block py-3 px-4 font-mono text-sm font-bold tracking-wider uppercase border-b border-border/60 transition-colors ${
      active ? 'text-accent bg-accent/10 border-l-2 border-l-accent' : 'text-foreground hover:bg-muted/30'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 border-b border-border backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
        
        {/* Left: Brand */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <span className="font-display text-2xl tracking-tight uppercase group-hover:tracking-normal transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            HACK<span className="text-accent">MATE</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 relative">
          {user ? (
            <>
              <Link to="/discover" className={navLinkClass(isActive('/discover'))}>
                DISCOVER HACKATHONS
                {isActive('/discover') && (
                  <motion.div layoutId="navbar-indicator" className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </Link>
              <Link to="/developers" className={navLinkClass(isActive('/developers'))}>
                DEVELOPERS
                {isActive('/developers') && (
                  <motion.div layoutId="navbar-indicator" className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </Link>
              <Link to="/team-requests" className={navLinkClass(isActive('/team-requests'))}>
                INBOX
                {isActive('/team-requests') && (
                  <motion.div layoutId="navbar-indicator" className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </Link>
              <Link to="/hackathons" className={navLinkClass(isActive('/hackathons'))}>
                MY HACKATHONS
                {isActive('/hackathons') && (
                  <motion.div layoutId="navbar-indicator" className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </Link>
              <Link to="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
                DASHBOARD
                {isActive('/dashboard') && (
                  <motion.div layoutId="navbar-indicator" className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={navLinkClass(isActive('/'))}>
                HOME
              </Link>
              <Link to="/discover" className={navLinkClass(isActive('/discover'))}>
                DISCOVER HACKATHONS
              </Link>
              <Link to="/developers" className={navLinkClass(isActive('/developers'))}>
                DEVELOPERS
              </Link>
              <Link to="/hackathons/new" className={navLinkClass(isActive('/hackathons/new'))}>
                POST A HACKATHON
              </Link>
              <a href="/#community" className={navLinkClass(isActive('/#community'))}>
                COMMUNITY
              </a>
            </>
          )}
        </nav>

        {/* Right: Auth / Profile & Hamburger */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                to="/profile"
                className="hidden sm:inline-block text-xs font-mono tracking-wider uppercase text-foreground border border-border px-3 py-1.5 hover:border-foreground transition-all bg-card"
              >
                {profile?.full_name || user.email}
              </Link>
              <button 
                onClick={handleLogout}
                className="hidden md:inline-block text-xs font-mono font-bold tracking-wider uppercase text-foreground hover:text-accent transition-colors duration-200"
              >
                LOG OUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-foreground hover:text-accent transition-colors duration-200"
              >
                SIGN IN
              </Link>
              <Link 
                to="/register" 
                className="hidden sm:inline-block text-xs sm:text-sm font-mono font-bold tracking-wider uppercase bg-foreground text-background px-4 py-2 hover:bg-accent hover:text-white transition-all duration-200"
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
            className="md:hidden p-2 text-foreground hover:text-accent transition-colors border border-border bg-card/60"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border bg-background/98 backdrop-blur-md overflow-hidden"
          >
            <div className="flex flex-col py-2 px-2" onClick={() => setMobileMenuOpen(false)}>
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
                    MY PROFILE
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-4 font-mono text-sm font-bold tracking-wider uppercase text-accent hover:bg-accent/10 border-b border-border/60 transition-colors"
                  >
                    LOG OUT
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
                  <a href="/#community" className={mobileNavLinkClass(isActive('/#community'))}>
                    COMMUNITY
                  </a>
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

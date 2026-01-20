import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  X, 
  HeartHandshake, 
  Calendar, 
  LogIn, 
  MapPin, 
  Clock, 
  Phone,
  Facebook,
  Twitter,
  Instagram,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { Button } from "../components/UI"; 

const PublicLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Handle Scroll for Sticky Nav styling
  useEffect(() => {
    const handleScroll = () => {
      // 40px is roughly the height of the top utility bar
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Donate", path: "/donate", icon: HeartHandshake },
    { label: "Visit", path: "/book-visit", icon: Calendar },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans text-zinc-900 bg-white selection:bg-black selection:text-white">
      
      {/* === 1. UTILITY BAR (Static - Scrolls Away) === */}
      <div className="bg-black text-white text-[10px] uppercase tracking-widest py-3 px-6 z-50 relative border-b border-zinc-800">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Location / Time */}
          <div className="flex items-center gap-6 opacity-80 font-medium">
            <span className="flex items-center gap-2">
              <MapPin size={10} className="text-white" />
              <span>Santa Elena, Bicol</span>
            </span>
            <span className="hidden md:inline w-px h-2 bg-zinc-700"></span>
            <span className="flex items-center gap-2">
              <Clock size={10} className="text-white" />
              <span>9:00 AM — 5:00 PM</span>
            </span>
          </div>

          {/* Socials / Action */}
          <div className="flex items-center gap-6">
             <a href="tel:+639001234567" className="hover:text-zinc-300 transition-colors">
              +63 (900) 123-4567
            </a>
            <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
              <a href="#" className="hover:text-zinc-300 transition-colors"><Facebook size={12} /></a>
              <a href="#" className="hover:text-zinc-300 transition-colors"><Twitter size={12} /></a>
              <a href="#" className="hover:text-zinc-300 transition-colors"><Instagram size={12} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* === 2. NAVIGATION BAR (Sticky) === */}
      <nav 
        className={`sticky top-0 z-40 transition-all duration-500 border-b ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-xl border-zinc-200 py-3 shadow-sm" 
            : "bg-white border-transparent py-5"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
          
          {/* IDENTITY: Edgy & Bold */}
          <Link to="/" className="flex items-center gap-3 group z-50">
            <div className="relative flex items-center justify-center h-10 w-10 bg-black text-white overflow-hidden rounded-none shadow-xl transition-transform group-hover:-translate-y-0.5 duration-300">
               <img src="/LOGO.png" alt="M" className="w-6 h-6 object-contain invert filter brightness-0 opacity-100" /> 
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="font-black text-xl tracking-tighter leading-none text-black">
                MASCD<span className="font-light text-zinc-400">MIS</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-zinc-900">
                Museum Portal
              </span>
            </div>
          </Link>

          {/* DESKTOP MENU: Minimalist Text Links */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-bold uppercase tracking-widest relative group py-2
                    ${isActive(link.path) ? "text-black" : "text-zinc-500 hover:text-black"}`}
                >
                  {link.label}
                  {/* Hover Underline Animation */}
                  <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-black transform origin-left transition-transform duration-300 ease-out ${isActive(link.path) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
                </Link>
              ))}
            </div>

            <div className="w-px h-8 bg-zinc-200"></div>

            <Link to="/login">
              <button className="group flex items-center gap-3 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-all duration-300 rounded-none shadow-lg hover:shadow-xl">
                <span>Staff Access</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          {/* MOBILE TOGGLE */}
          <button 
            className="md:hidden p-2 text-black hover:bg-zinc-100 transition-colors z-50"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE OVERLAY MENU (Full Screen Edgy Style) */}
        <div className={`fixed inset-0 bg-white z-40 flex flex-col justify-center items-center gap-8 transition-all duration-500 ease-in-out md:hidden ${isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileOpen(false)}
                className="text-3xl font-black tracking-tighter hover:text-zinc-500 transition-colors flex items-center gap-4"
              >
                {link.label}
                <ChevronRight size={24} className="opacity-0 -ml-4 hover:ml-0 hover:opacity-100 transition-all" />
              </Link>
            ))}
            <div className="w-12 h-1 bg-black my-4"></div>
            <Link to="/login" onClick={() => setIsMobileOpen(false)}>
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Staff Portal &rarr;</span>
            </Link>
        </div>
      </nav>

      {/* === 3. CONTENT AREA === */}
      <main className="flex-1 bg-zinc-50">
        <Outlet />
      </main>

      {/* === 4. FOOTER (Minimalist Grid) === */}
      <footer className="bg-black text-white pt-20 pb-10 border-t-4 border-zinc-800">
        <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Identity */}
          <div className="md:col-span-4 space-y-6">
            <div className="h-12 w-12 bg-white flex items-center justify-center">
               <img src="/LOGO.png" alt="M" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter leading-tight">
              Preserving <br/><span className="text-zinc-500">History.</span>
            </h2>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Explore</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/" className="hover:text-zinc-400 transition-colors">Home</Link></li>
              <li><Link to="/inventory" className="hover:text-zinc-400 transition-colors">Collection</Link></li>
              <li><Link to="/donate" className="hover:text-zinc-400 transition-colors">Donate</Link></li>
              <li><Link to="/book-visit" className="hover:text-zinc-400 transition-colors">Visit Us</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Visit</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-white mt-0.5"/> 
                <span className="leading-relaxed">123 Museum Drive<br/>Santa Elena, Bicol Philippines</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock size={16} className="text-white"/> 
                <span>Open Daily: 9:00 AM - 5:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="max-w-screen-2xl mx-auto px-6 mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-600">
          <p>© {new Date().getFullYear()} MASCD Management System</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Credits</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
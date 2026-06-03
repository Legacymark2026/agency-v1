"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const Header = () => {
  const t = useTranslations("header");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState(false);
  const [userInitials, setUserInitials] = useState("");
  
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { label: t("home"), href: "#hero" },
    { label: t("products"), href: "/productos" },
    { label: t("process"), href: "#proceso" },
    { label: t("experience"), href: "#experiencia" },
    { label: t("contact"), href: "#footer" },
  ];

  const checkSession = () => {
    const active = localStorage.getItem("goldneez_session") === "active";
    setSession(active);
    if (active) {
      const currentUser = localStorage.getItem("goldneez_current_user");
      if (currentUser) {
        try {
          const parsed = JSON.parse(currentUser);
          if (parsed && parsed.name) {
            setUserInitials(parsed.name.charAt(0).toUpperCase());
          }
        } catch (e) {
          // ignore
        }
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial session check
    checkSession();

    // Listen to custom auth events
    window.addEventListener("user-login", checkSession);
    window.addEventListener("user-logout", checkSession);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("user-login", checkSession);
      window.removeEventListener("user-logout", checkSession);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);

    const isPageRoute = href === "/productos" || href === "/dashboard" || href === "/login";
    const isSubpage = pathname === "/productos" || pathname === "/dashboard" || pathname === "/login";

    if (isPageRoute) {
      router.push(href);
      return;
    }

    if (isSubpage) {
      router.push(`/${href}`);
      return;
    }

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-[10px]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-20 py-4">
        {/* Logo */}
        <a href="#hero" onClick={(e) => handleClick(e, "#hero")} className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Goldneez Logo" className="h-10 w-auto object-contain" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link.href)}
              className="font-quattrocento text-sm uppercase tracking-wider text-aluminum hover:text-amber transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth Button */}
        <div className="hidden lg:flex items-center gap-4">
          {session ? (
            <a
              href="/dashboard"
              onClick={(e) => handleClick(e, "/dashboard")}
              className="flex items-center gap-2 font-quattrocento text-xs uppercase tracking-wider text-aluminum hover:text-amber bg-white/5 border border-aluminum/10 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-amber text-black flex items-center justify-center font-cinzel text-[10px] font-bold">
                {userInitials}
              </div>
              Mi Cuenta
            </a>
          ) : (
            <a
              href="/login"
              onClick={(e) => handleClick(e, "/login")}
              className="font-quattrocento text-xs uppercase tracking-widest text-black bg-amber hover:bg-amber-light px-5 py-2.5 rounded-xl transition-all font-bold cursor-pointer"
            >
              Club Acceso
            </a>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-aluminum hover:text-amber transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-lg border-t border-aluminum/10">
          <nav className="flex flex-col px-6 py-6 gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className="font-quattrocento text-base uppercase tracking-wider text-aluminum hover:text-amber transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}

            {/* Mobile Auth Button */}
            <div className="border-t border-aluminum/10 pt-4 mt-2">
              {session ? (
                <a
                  href="/dashboard"
                  onClick={(e) => handleClick(e, "/dashboard")}
                  className="flex items-center gap-2 font-quattrocento text-sm uppercase tracking-wider text-amber"
                >
                  <div className="w-6 h-6 rounded-full bg-amber text-black flex items-center justify-center font-cinzel text-xs font-bold">
                    {userInitials}
                  </div>
                  Mi Panel Privado
                </a>
              ) : (
                <a
                  href="/login"
                  onClick={(e) => handleClick(e, "/login")}
                  className="font-quattrocento text-sm uppercase tracking-widest text-amber font-bold"
                >
                  Iniciar Sesión / Club Oro
                </a>
              )}
            </div>

          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

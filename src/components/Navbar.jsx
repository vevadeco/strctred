import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Hammer } from "lucide-react";

const Navbar = ({ onGetQuote, hasPromo = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Structures", href: "#services" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Service Area", href: "#service-area" },
  ];

  return (
    <nav
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
        hasPromo ? "top-[88px] md:top-[44px]" : "top-0"
      } bg-white/95 backdrop-blur-sm shadow-sm`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3" data-testid="logo">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Hammer className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl text-foreground leading-tight font-semibold tracking-tight">
                Strctred
              </span>
              <span className="text-[10px] text-muted-foreground font-body tracking-[0.2em] uppercase">
                Living Spaces
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-foreground/80 hover:text-primary transition-colors font-body font-medium text-sm"
                data-testid={`nav-link-${link.name.toLowerCase().replace(" ", "-")}`}
              >
                {link.name}
              </a>
            ))}
            <Button
              onClick={onGetQuote}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold px-6 btn-primary"
              data-testid="nav-get-quote-btn"
            >
              Get Free Estimate
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            data-testid="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border" data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-2 text-foreground/80 hover:text-primary transition-colors font-body"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Button
              onClick={() => {
                onGetQuote();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold"
              data-testid="mobile-get-quote-btn"
            >
              Get Free Estimate
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

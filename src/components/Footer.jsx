import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const structures = [
    "Custom Decks",
    "Pergolas & Shade Structures",
    "Sheds & Outbuildings",
    "Open Concept Outdoor Living",
    "Railings & Privacy Screens",
  ];

  const serviceAreas = [
    "Hamilton",
    "Burlington",
    "Oakville",
    "Niagara Region",
  ];

  return (
    <footer className="bg-primary text-primary-foreground" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img src="/logo.png" alt="Strctred Outdoor Living Spaces" className="h-16 w-auto brightness-0 invert" />
            </div>
            <p className="font-body text-primary-foreground/80 text-sm leading-relaxed mb-6">
              Premium outdoor structures built with precision craftsmanship. 
              Decks, pergolas, sheds, and open concept spaces designed for how you live.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+15551234567"
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-secondary transition-colors"
                data-testid="footer-phone"
              >
                <Phone className="w-4 h-4" />
                <span className="font-body text-sm">(555) 123-4567</span>
              </a>
              <a
                href="mailto:hello@strctred.com"
                className="flex items-center gap-3 text-primary-foreground/80 hover:text-secondary transition-colors"
                data-testid="footer-email"
              >
                <Mail className="w-4 h-4" />
                <span className="font-body text-sm">hello@strctred.com</span>
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="font-body text-sm">Hamilton, Ontario, Canada</span>
              </div>
            </div>
          </div>

          {/* Structures */}
          <div>
            <h4 className="font-heading text-lg mb-6">What We Build</h4>
            <ul className="space-y-3">
              {structures.map((item) => (
                <li key={item}>
                  <a
                    href="#services"
                    className="font-body text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h4 className="font-heading text-lg mb-6">Where We Build</h4>
            <ul className="space-y-3">
              {serviceAreas.map((area) => (
                <li key={area}>
                  <a
                    href="#service-area"
                    className="font-body text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
                  >
                    {area}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours & Info */}
          <div>
            <h4 className="font-heading text-lg mb-6">Business Hours</h4>
            <div className="space-y-3 font-body text-sm text-primary-foreground/80">
              <div className="flex justify-between">
                <span>Monday – Friday</span>
                <span>7:00 AM – 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>8:00 AM – 2:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
              <p className="font-body text-sm">
                <span className="font-semibold text-secondary">Free Site Visits</span>
                <br />
                We come to you for estimates — no obligation.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-primary-foreground/60">
              © {currentYear} Strctred Living Spaces. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="font-body text-sm text-primary-foreground/60 hover:text-secondary transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="font-body text-sm text-primary-foreground/60 hover:text-secondary transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

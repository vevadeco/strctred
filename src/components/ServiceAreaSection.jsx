import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// Approximate positions on a 600x500 SVG representing Southern Ontario
// Coordinates based on real geographic positions relative to the Golden Horseshoe
const CITY_COORDS = {
  "hamilton": { x: 310, y: 260 },
  "burlington": { x: 330, y: 235 },
  "oakville": { x: 370, y: 220 },
  "stoney creek": { x: 340, y: 275 },
  "ancaster": { x: 280, y: 270 },
  "dundas": { x: 290, y: 255 },
  "grimsby": { x: 360, y: 290 },
  "brantford": { x: 230, y: 310 },
  "niagara region": { x: 370, y: 340 },
  "niagara falls": { x: 380, y: 330 },
  "st. catharines": { x: 360, y: 310 },
  "toronto": { x: 430, y: 185 },
  "mississauga": { x: 400, y: 205 },
  "brampton": { x: 390, y: 175 },
  "milton": { x: 340, y: 240 },
  "cambridge": { x: 230, y: 280 },
  "kitchener": { x: 200, y: 260 },
  "waterloo": { x: 195, y: 245 },
  "guelph": { x: 260, y: 235 },
  "welland": { x: 350, y: 360 },
  "fort erie": { x: 400, y: 370 },
  "caledonia": { x: 290, y: 310 },
  "paris": { x: 240, y: 295 },
  "simcoe": { x: 210, y: 370 },
  "norfolk": { x: 200, y: 380 },
  "haldimand": { x: 270, y: 350 },
  "lincoln": { x: 350, y: 300 },
  "niagara-on-the-lake": { x: 390, y: 295 },
  "london": { x: 110, y: 310 },
  "woodstock": { x: 170, y: 295 },
};

function getCityCoords(name) {
  return CITY_COORDS[name.toLowerCase()] || null;
}

const ServiceAreaSection = ({ onGetQuote, serviceAreas: propAreas }) => {
  const serviceAreas = propAreas && propAreas.length > 0 ? propAreas : [
    { name: "Hamilton", primary: true },
    { name: "Burlington", primary: false },
    { name: "Oakville", primary: false },
    { name: "Stoney Creek", primary: false },
    { name: "Ancaster", primary: false },
    { name: "Dundas", primary: false },
    { name: "Grimsby", primary: false },
    { name: "Brantford", primary: false },
    { name: "Niagara Region", primary: false },
  ];

  return (
    <section
      id="service-area"
      className="py-20 lg:py-32 bg-background relative"
      data-testid="service-area-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Map Section */}
          <div className="relative order-2 lg:order-1">
            <div
              className="relative rounded-2xl overflow-hidden shadow-xl bg-[#e8f4f8]"
              data-testid="service-area-map"
            >
              {/* Southern Ontario SVG Map */}
              <svg viewBox="0 0 600 500" className="w-full h-[400px] lg:h-[500px]" xmlns="http://www.w3.org/2000/svg">
                {/* Lake Ontario */}
                <path d="M300 50 Q450 40 560 100 Q580 150 570 200 Q520 250 450 240 Q380 220 300 230 Q250 225 200 200 Q160 170 180 120 Q220 60 300 50Z" fill="#b8d4e3" opacity="0.6" />
                {/* Lake Erie */}
                <path d="M20 380 Q80 350 180 370 Q250 380 280 400 Q250 430 180 440 Q100 445 40 420 Q15 405 20 380Z" fill="#b8d4e3" opacity="0.6" />
                {/* Niagara River area */}
                <path d="M280 240 Q290 280 285 320 Q280 350 275 380" fill="none" stroke="#b8d4e3" strokeWidth="8" opacity="0.5" />
                {/* Land mass outline */}
                <path d="M100 100 Q150 80 200 90 Q180 120 160 170 Q140 220 130 270 Q120 320 110 370 Q130 420 180 440 Q250 460 350 450 Q450 440 520 400 Q560 370 580 320 Q590 270 570 200 Q550 160 520 130 Q480 100 420 90 Q360 85 300 95 Q240 100 200 90 Q150 80 100 100Z" fill="#d4e6d4" opacity="0.3" stroke="#9cb89c" strokeWidth="1" />

                {/* City labels and pins */}
                {serviceAreas.map((area) => {
                  const coords = getCityCoords(area.name);
                  if (!coords) return null;
                  const isPrimary = area.primary;
                  return (
                    <g key={area.name}>
                      {isPrimary ? (
                        <>
                          <circle cx={coords.x} cy={coords.y} r="18" fill="hsl(var(--primary))" opacity="0.2">
                            <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={coords.x} cy={coords.y} r="12" fill="hsl(var(--primary))" />
                          <text x={coords.x} y={coords.y + 28} textAnchor="middle" className="font-body" fill="hsl(var(--primary))" fontSize="11" fontWeight="700">{area.name}</text>
                        </>
                      ) : (
                        <>
                          <circle cx={coords.x} cy={coords.y} r="7" fill="hsl(var(--accent))" />
                          <text x={coords.x} y={coords.y + 18} textAnchor="middle" className="font-body" fill="hsl(var(--foreground))" fontSize="9" fontWeight="500" opacity="0.8">{area.name}</text>
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Lake labels */}
                <text x="400" y="140" textAnchor="middle" fill="#5a8fa8" fontSize="13" fontStyle="italic" opacity="0.7">Lake Ontario</text>
                <text x="150" y="410" textAnchor="middle" fill="#5a8fa8" fontSize="11" fontStyle="italic" opacity="0.7">Lake Erie</text>
              </svg>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <p className="font-body text-xs text-muted-foreground mb-2">Service Coverage</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="text-xs font-body">{serviceAreas.find(a => a.primary)?.name || "Home Base"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-accent rounded-full" />
                    <span className="text-xs font-body">Coverage Area</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="order-1 lg:order-2">
            <span className="inline-block px-4 py-1.5 bg-secondary/30 text-primary font-body font-medium text-sm rounded-full mb-4">
              Where We Build
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Serving the
              <br />
              <span className="text-primary">Greater {serviceAreas.find(a => a.primary)?.name || "Hamilton"} Area</span>
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-8 leading-relaxed">
              Based in {serviceAreas.find(a => a.primary)?.name || "Hamilton"}, we build outdoor structures across the surrounding regions. 
              From urban backyards to rural properties — if you can dream it, we can build it.
            </p>

            {/* Service Areas Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {serviceAreas.map((area) => (
                <div
                  key={area.name}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    area.primary
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50"
                  }`}
                  data-testid={`service-area-${area.name.toLowerCase().replace(" ", "-")}`}
                >
                  <CheckCircle
                    className={`w-4 h-4 flex-shrink-0 ${
                      area.primary ? "text-secondary" : "text-primary"
                    }`}
                  />
                  <span
                    className={`font-body text-sm ${
                      area.primary ? "font-semibold" : "font-medium text-foreground"
                    }`}
                  >
                    {area.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="font-body text-sm text-muted-foreground mb-6">
              Don't see your area? Reach out — we travel for the right project.
            </p>

            <Button
              onClick={onGetQuote}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold px-8 py-6 text-lg btn-primary"
              data-testid="service-area-cta-btn"
            >
              Get a Free Estimate for Your Area
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAreaSection;

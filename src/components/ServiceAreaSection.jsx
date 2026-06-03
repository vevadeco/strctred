import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle } from "lucide-react";

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
              className="relative rounded-2xl overflow-hidden shadow-xl"
              data-testid="service-area-map"
            >
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
                alt="Service area coverage map"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />

              <div className="absolute inset-0 bg-primary/10" />

              {/* Location Pins — dynamically placed from service areas */}
              <div className="absolute inset-0">
                <div className="relative w-full h-full">
                  {serviceAreas.map((area, idx) => {
                    const total = serviceAreas.length;
                    // Distribute pins in a natural pattern across the map
                    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
                    const radius = area.primary ? 0 : 25 + (idx % 3) * 8;
                    const cx = 50 + radius * Math.cos(angle);
                    const cy = 50 + radius * Math.sin(angle);
                    const left = Math.max(10, Math.min(90, cx));
                    const top = Math.max(15, Math.min(85, cy));

                    if (area.primary) {
                      return (
                        <div
                          key={area.name}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: "50%", top: "50%" }}
                        >
                          <div className="relative">
                            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
                              <MapPin className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                              <span className="bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-body font-semibold">
                                {area.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={area.name}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group/pin"
                        style={{ left: `${left}%`, top: `${top}%` }}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-md transition-transform group-hover/pin:scale-125">
                            <MapPin className="w-4 h-4 text-accent-foreground" />
                          </div>
                          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity">
                            <span className="bg-card text-foreground px-2 py-0.5 rounded text-[10px] font-body font-medium shadow-sm border">
                              {area.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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

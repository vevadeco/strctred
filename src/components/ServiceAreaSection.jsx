import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle } from "lucide-react";

const ServiceAreaSection = ({ onGetQuote }) => {
  const serviceAreas = [
    { name: "Hamilton", primary: true },
    { name: "Burlington", primary: false },
    { name: "Oakville", primary: false },
    { name: "Stoney Creek", primary: false },
    { name: "Ancaster", primary: false },
    { name: "Dundas", primary: false },
    { name: "Grimsby", primary: false },
    { name: "Brampton", primary: false },
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
                alt="Greater Toronto and Hamilton Area Map"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />

              <div className="absolute inset-0 bg-primary/10" />

              {/* Location Pins */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <div
                    className="absolute left-[30%] top-[60%] transform -translate-x-1/2 -translate-y-1/2"
                    data-testid="map-pin-hamilton"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <MapPin className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-body font-semibold">
                          Home Base
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute left-[55%] top-[30%] transform -translate-x-1/2 -translate-y-1/2"
                    data-testid="map-pin-toronto"
                  >
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-5 h-5 text-accent-foreground" />
                    </div>
                  </div>

                  <div className="absolute left-[40%] top-[45%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-md">
                      <MapPin className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  </div>

                  <div className="absolute left-[50%] top-[40%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-md">
                      <MapPin className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <p className="font-body text-xs text-muted-foreground mb-2">Build Area</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                    <span className="text-xs font-body">Home Base</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-accent rounded-full" />
                    <span className="text-xs font-body">Extended Coverage</span>
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
              <span className="text-primary">Greater Hamilton Area</span>
            </h2>
            <p className="font-body text-muted-foreground text-lg mb-8 leading-relaxed">
              Based in Hamilton, we build outdoor structures across the GTA and surrounding regions. 
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

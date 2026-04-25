import { Button } from "@/components/ui/button";
import { ArrowRight, Columns3, Fence, Warehouse, LayoutPanelTop } from "lucide-react";

const ServicesSection = ({ onGetQuote }) => {
  const services = [
    {
      id: "deck-build",
      title: "Custom Decks",
      description:
        "Elevated or ground-level, composite or natural wood — we design and build decks that become the heart of your backyard. Multi-level layouts, built-in seating, and integrated lighting available.",
      icon: LayoutPanelTop,
      image: "https://images.unsplash.com/photo-1591825729269-caeb344f6df2?auto=format&fit=crop&q=80&w=940",
      features: ["Composite & Cedar", "Multi-Level", "Built-In Lighting", "Railing Systems"],
      span: "md:col-span-2 md:row-span-2",
      large: true,
    },
    {
      id: "pergola",
      title: "Pergolas & Shade Structures",
      description:
        "Freestanding or attached pergolas that define your outdoor room with style and shade.",
      icon: Columns3,
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800",
      features: ["Louvered Roofs", "Attached & Freestanding", "Custom Stain"],
      span: "md:col-span-1",
      large: false,
    },
    {
      id: "shed",
      title: "Sheds & Outbuildings",
      description:
        "From storage sheds to workshops and studios — functional structures built to match your home.",
      icon: Warehouse,
      image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&q=80&w=800",
      features: ["Storage", "Workshops", "She-Sheds & Studios"],
      span: "md:col-span-1",
      large: false,
    },
  ];

  return (
    <section
      id="services"
      className="py-20 lg:py-32 bg-background relative z-10"
      data-testid="services-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-secondary/30 text-primary font-body font-medium text-sm rounded-full mb-4">
            What We Build
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            Outdoor Structures
            <br />
            <span className="text-primary">Built to Last</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-2xl mx-auto">
            From custom decks to open concept living spaces, every structure is engineered for durability and designed for your lifestyle.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`${service.span} relative group overflow-hidden rounded-2xl bento-item`}
              data-testid={`service-card-${service.id}`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${service.image}')` }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div
                className={`relative z-10 h-full flex flex-col justify-end p-6 ${
                  service.large ? "min-h-[500px] lg:min-h-[600px]" : "min-h-[280px]"
                }`}
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>

                <h3
                  className={`font-heading text-white mb-2 ${
                    service.large ? "text-2xl lg:text-3xl" : "text-xl"
                  }`}
                >
                  {service.title}
                </h3>

                <p
                  className={`font-body text-white/80 mb-4 ${
                    service.large ? "text-base" : "text-sm"
                  }`}
                >
                  {service.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white text-xs font-body rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {service.large && (
                  <Button
                    onClick={onGetQuote}
                    className="w-fit bg-accent hover:bg-accent/90 text-accent-foreground font-body font-semibold group/btn"
                    data-testid="service-cta-btn"
                  >
                    Start Your Project
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Open Concept Feature Block */}
        <div className="mt-12 relative group overflow-hidden rounded-2xl bento-item">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1400')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          <div className="relative z-10 flex flex-col justify-center p-8 md:p-12 min-h-[300px] max-w-xl">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4">
              <Fence className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading text-2xl lg:text-3xl text-white mb-3">
              Open Concept Outdoor Living
            </h3>
            <p className="font-body text-white/80 mb-6">
              Seamlessly blend your indoor and outdoor spaces. We design and build complete outdoor rooms — 
              combining decks, pergolas, privacy screens, and integrated features into one cohesive living area.
            </p>
            <Button
              onClick={onGetQuote}
              className="w-fit bg-accent hover:bg-accent/90 text-accent-foreground font-body font-semibold group/btn"
              data-testid="open-concept-cta-btn"
            >
              Explore Open Concepts
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="font-body text-muted-foreground mb-4">
            Not sure where to start? We'll help you plan the perfect structure.
          </p>
          <Button
            onClick={onGetQuote}
            variant="outline"
            className="font-body font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            data-testid="services-cta-btn"
          >
            Schedule a Free Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

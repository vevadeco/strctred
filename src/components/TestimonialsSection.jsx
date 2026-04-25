import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Mark & Lisa Donovan",
      location: "Backyard Deck",
      rating: 5,
      text: "They built a two-level composite deck that completely changed how we use our backyard. The craftsmanship is incredible — every joint, every railing detail is perfect.",
      avatar: "MD",
    },
    {
      id: 2,
      name: "Rachel Simmons",
      location: "Pergola Install",
      rating: 5,
      text: "Our louvered pergola is the best investment we've made. The team was professional from design to final walkthrough. We practically live outside now.",
      avatar: "RS",
    },
    {
      id: 3,
      name: "James Kowalski",
      location: "Custom Shed",
      rating: 5,
      text: "I needed a workshop that matched my home's style. They nailed it — insulated, wired, and finished beautifully. It's more than a shed, it's my favorite room.",
      avatar: "JK",
    },
    {
      id: 4,
      name: "Priya Patel",
      location: "Open Concept Space",
      rating: 5,
      text: "They designed an open concept outdoor living area with a deck, pergola, and privacy screens all integrated. It feels like a natural extension of our home.",
      avatar: "PP",
    },
    {
      id: 5,
      name: "Tom & Angela Rivera",
      location: "Deck & Pergola Combo",
      rating: 4,
      text: "Great communication throughout the project. The deck and attached pergola look stunning. Our neighbors keep asking who built it. Highly recommend.",
      avatar: "TR",
    },
    {
      id: 6,
      name: "David Okafor",
      location: "Ground-Level Deck",
      rating: 5,
      text: "Clean work, fair pricing, and they finished ahead of schedule. The ground-level deck with built-in planters is exactly what we envisioned. Top-notch crew.",
      avatar: "DO",
    },
  ];

  const overallRating = 4.9;
  const totalReviews = 84;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-accent fill-accent" : "text-muted"
        }`}
      />
    ));
  };

  return (
    <section
      id="testimonials"
      className="py-20 lg:py-32 bg-muted/30 relative"
      data-testid="testimonials-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-secondary/30 text-primary font-body font-medium text-sm rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
            What Our Clients
            <br />
            <span className="text-primary">Say About Us</span>
          </h2>

          {/* Overall Rating */}
          <div
            className="flex items-center justify-center gap-4 mt-6"
            data-testid="overall-rating"
          >
            <div className="flex items-center gap-1">{renderStars(5)}</div>
            <span className="font-heading text-3xl text-foreground">{overallRating}</span>
            <span className="font-body text-muted-foreground">
              based on {totalReviews} reviews
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="bg-card border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 testimonial-card"
              data-testid={`testimonial-card-${testimonial.id}`}
            >
              <CardContent className="p-6">
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Quote */}
                <p className="font-body text-foreground/80 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-primary text-primary-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground font-body font-medium">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-body font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="font-body text-sm text-muted-foreground">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

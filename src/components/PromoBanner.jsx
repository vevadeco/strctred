import { useState, useEffect } from "react";
import { X, Clock, Percent } from "lucide-react";

const PromoBanner = ({ settings, onClose }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const getDeadline = () => {
      if (settings?.deadline_date) {
        return new Date(settings.deadline_date);
      }
      const now = new Date();
      let deadline = new Date(now.getFullYear(), 5, 1);
      if (now > deadline) {
        deadline = new Date(now.getFullYear() + 1, 5, 1);
      }
      return deadline;
    };

    const deadline = getDeadline();

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [settings?.deadline_date]);

  const TimeBlock = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-0.5 min-w-[32px] sm:min-w-[36px]">
        <span className="font-heading text-sm sm:text-base font-bold text-white">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[8px] sm:text-[9px] text-white/80 mt-0.5 font-body uppercase">
        {label}
      </span>
    </div>
  );

  const title = settings?.title || "Summer Build Special — 10% OFF Decks & Pergolas!";
  const subtitle = settings?.subtitle || "Book your project before the season fills up";
  const ctaText = settings?.cta_text || "Claim Offer";

  return (
    <div
      className="bg-accent text-accent-foreground fixed top-0 left-0 right-0 z-50"
      data-testid="promo-banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-body font-bold text-white text-xs sm:text-sm">
                {title}
              </p>
              <p className="font-body text-white/90 text-[10px] sm:text-xs">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white/80" />
            <div className="flex items-center gap-0.5">
              <TimeBlock value={timeLeft.days} label="Days" />
              <span className="text-white/60 text-sm font-bold mx-0.5">:</span>
              <TimeBlock value={timeLeft.hours} label="Hrs" />
              <span className="text-white/60 text-sm font-bold mx-0.5">:</span>
              <TimeBlock value={timeLeft.minutes} label="Min" />
              <span className="text-white/60 text-sm font-bold mx-0.5">:</span>
              <TimeBlock value={timeLeft.seconds} label="Sec" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#hero"
              className="hidden sm:inline-flex items-center px-3 py-1 bg-white text-accent font-body font-semibold text-xs rounded-full hover:bg-white/90 transition-colors"
              data-testid="promo-cta-btn"
            >
              {ctaText}
            </a>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close promotion banner"
              data-testid="promo-close-btn"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-white/20">
          <Clock className="w-3 h-3 text-white/80" />
          <span className="font-body text-[10px] text-white/80 mr-1">Ends in:</span>
          <div className="flex items-center gap-0.5">
            <span className="font-body font-bold text-white text-xs">{timeLeft.days}d</span>
            <span className="text-white/60 text-xs">:</span>
            <span className="font-body font-bold text-white text-xs">{String(timeLeft.hours).padStart(2, "0")}h</span>
            <span className="text-white/60 text-xs">:</span>
            <span className="font-body font-bold text-white text-xs">{String(timeLeft.minutes).padStart(2, "0")}m</span>
            <span className="text-white/60 text-xs">:</span>
            <span className="font-body font-bold text-white text-xs">{String(timeLeft.seconds).padStart(2, "0")}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;

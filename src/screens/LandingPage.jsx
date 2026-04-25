"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ServiceAreaSection from "@/components/ServiceAreaSection";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import axios from "axios";

const API = "/api";

const LandingPage = () => {
  const [showPromo, setShowPromo] = useState(false);
  const [promoSettings, setPromoSettings] = useState(null);

  useEffect(() => {
    const fetchPromoSettings = async () => {
      try {
        const response = await axios.get(`${API}/promo-banner`);
        setPromoSettings(response.data);
        setShowPromo(response.data.enabled);
      } catch (e) {
        console.error("Failed to fetch promo settings:", e);
      }
    };

    const trackPageView = async () => {
      try {
        let sessionId = sessionStorage.getItem("session_id");
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem("session_id", sessionId);
        }

        await axios.post(`${API}/analytics/pageview`, {
          page: window.location.pathname,
          referrer: document.referrer || null,
          session_id: sessionId,
        });
      } catch (e) {
        console.error("Failed to track pageview:", e);
      }
    };

    fetchPromoSettings();
    trackPageView();
  }, []);

  const scrollToForm = () => {
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg" data-testid="landing-page">
      {showPromo && promoSettings && (
        <PromoBanner
          settings={promoSettings}
          onClose={() => setShowPromo(false)}
        />
      )}
      <Navbar onGetQuote={scrollToForm} hasPromo={showPromo} />
      <main>
        <HeroSection />
        <ServicesSection onGetQuote={scrollToForm} />
        <TestimonialsSection />
        <ServiceAreaSection onGetQuote={scrollToForm} />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;

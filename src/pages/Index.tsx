import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WorkflowSection from "@/components/WorkflowSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import PriceCalculator from "@/components/PriceCalculator";
import Footer from "@/components/Footer";
import AiChat from "@/components/AiChat";
import { useScrollReveal, useReadProgress } from "@/hooks/useScrollReveal";

const Index = () => {
  useScrollReveal();
  useReadProgress();

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <PriceCalculator />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <AiChat />
    </main>
  );
};

export default Index;
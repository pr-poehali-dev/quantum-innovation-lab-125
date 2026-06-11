import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WorkflowSection from "@/components/WorkflowSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import PriceCalculator from "@/components/PriceCalculator";
import Footer from "@/components/Footer";
import AiChat from "@/components/AiChat";
import LeadModal from "@/components/LeadModal";
import { useLeadModal } from "@/context/LeadModalContext";
import { useScrollReveal, useReadProgress } from "@/hooks/useScrollReveal";

const Index = () => {
  useScrollReveal();
  useReadProgress();
  const { open, closeModal } = useLeadModal();

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
      <LeadModal open={open} onClose={closeModal} />
    </main>
  );
};

export default Index;
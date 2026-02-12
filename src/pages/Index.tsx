import Navbar from "@/components/proposal/Navbar";
import CoverSection from "@/components/proposal/CoverSection";
import BusinessUnitsSection from "@/components/proposal/BusinessUnitsSection";
import DiagnosisSection from "@/components/proposal/DiagnosisSection";
import WorkPlanSection from "@/components/proposal/WorkPlanSection";
import PricingSection from "@/components/proposal/PricingSection";
import NextStepsSection from "@/components/proposal/NextStepsSection";

const Index = () => {
  return (
    <main className="bg-background">
      <Navbar />
      <CoverSection />
      <BusinessUnitsSection />
      <DiagnosisSection />
      <WorkPlanSection />
      <PricingSection />
      <NextStepsSection />
    </main>
  );
};

export default Index;

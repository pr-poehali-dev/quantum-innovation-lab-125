import { useState } from "react";
import { useLeadModal } from "@/context/LeadModalContext";
import { BASE, ORIGINS, ROASTS, PACKAGINGS, DESIGNS } from "./calculator/calculator.types";
import CalculatorStepPanel from "./calculator/CalculatorStepPanel";
import CalculatorSummary from "./calculator/CalculatorSummary";

const PriceCalculator = () => {
  const [step,   setStep]   = useState(0);
  const [origin, setOrigin] = useState(-1);
  const [roast,  setRoast]  = useState(1);
  const [pkg,    setPkg]    = useState(-1);
  const [design, setDesign] = useState(-1);
  const [volume, setVolume] = useState(100);

  const canNext = (() => {
    if (step === 0) return origin >= 0;
    if (step === 2) return pkg    >= 0;
    if (step === 3) return design >= 0;
    return true;
  })();

  const originExtra = origin >= 0 ? ORIGINS[origin].extra  : 0;
  const roastExtra  = ROASTS[roast].extra;
  const pkgExtra    = pkg    >= 0 ? PACKAGINGS[pkg].extra   : 0;
  const designExtra = design >= 0 && !DESIGNS[design].soon ? DESIGNS[design].extra : 0;
  const pricePerKg  = BASE + originExtra + roastExtra + pkgExtra + designExtra;
  const discount    = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total       = Math.round(volume * pricePerKg * (1 - discount));
  const leadTime    = volume <= 200 ? 14 : volume <= 500 ? 18 : 25;
  const isLast      = step === 4; // STEPS.length - 1

  const { openModal } = useLeadModal();

  const goNext = () => { if (canNext && !isLast) setStep(s => s + 1); };

  return (
    <section id="calculator" className="py-24">
      <div className="max-w-5xl mx-auto px-6">

        {/* Заголовок */}
        <div className="scroll-reveal mb-10">
          <span className="text-xs font-mono text-primary tracking-wider">ПРОИЗВОДСТВЕННЫЙ БРИФ</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold">
            Рассчитайте стоимость<br />
            <span className="text-primary">своей партии</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          <CalculatorStepPanel
            step={step}
            origin={origin}
            roast={roast}
            pkg={pkg}
            design={design}
            volume={volume}
            canNext={canNext}
            isLast={isLast}
            setStep={setStep}
            setOrigin={setOrigin}
            setRoast={setRoast}
            setPkg={setPkg}
            setDesign={setDesign}
            setVolume={setVolume}
            goNext={goNext}
            onSubmit={openModal}
          />

          <CalculatorSummary
            step={step}
            origin={origin}
            roast={roast}
            pkg={pkg}
            design={design}
            volume={volume}
            total={total}
            discount={discount}
            leadTime={leadTime}
          />

        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;

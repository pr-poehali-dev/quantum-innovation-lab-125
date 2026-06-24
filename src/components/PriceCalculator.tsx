import { useState, useEffect } from "react";
import { useLeadModal } from "@/context/LeadModalContext";
import { ROASTS, PACKAGINGS, DESIGNS } from "./calculator/calculator.types";
import CalculatorStepPanel from "./calculator/CalculatorStepPanel";
import CalculatorSummary from "./calculator/CalculatorSummary";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

export interface CalcOrigin {
  id: number;
  label: string;
  desc: string;
  price_usd: number;
  sort_order: number;
}

interface CalcParams {
  [key: string]: { value: number; label: string };
}

// Дефолтные параметры на случай если API недоступен
const DEFAULT_PARAMS: CalcParams = {
  pkg_1kg:        { value: 58.5,  label: "Упаковка 1 кг" },
  transport_1kg:  { value: 12.61, label: "Транспорт 1 кг" },
  production_1kg: { value: 9.95,  label: "Производство 1 кг" },
  roasting_1kg:   { value: 120.0, label: "Обжарка 1 кг" },
  weight_loss:    { value: 0.15,  label: "Потеря веса" },
  pkg_250g:        { value: 47.0,  label: "Упаковка 250 г" },
  transport_250g:  { value: 3.15,  label: "Транспорт 250 г" },
  production_250g: { value: 2.49,  label: "Производство 250 г" },
  roasting_250g:   { value: 40.0,  label: "Обжарка 250 г" },
};

const DEFAULT_USD = 85;

export function calcPrice1kg(origin: CalcOrigin, params: CalcParams, usd: number): number {
  const wl = params["weight_loss"]?.value ?? 0.15;
  return Math.round(
    (origin.price_usd * usd / (1 - wl))
    + (params["pkg_1kg"]?.value ?? 0)
    + (params["transport_1kg"]?.value ?? 0)
    + (params["production_1kg"]?.value ?? 0)
    + (params["roasting_1kg"]?.value ?? 0)
  );
}

export function calcPrice250g(origin: CalcOrigin, params: CalcParams, usd: number): number {
  const wl = params["weight_loss"]?.value ?? 0.15;
  return Math.round(
    (origin.price_usd * usd * 0.25 / (1 - wl))
    + (params["pkg_250g"]?.value ?? 0)
    + (params["transport_250g"]?.value ?? 0)
    + (params["production_250g"]?.value ?? 0)
    + (params["roasting_250g"]?.value ?? 0)
  );
}

const PriceCalculator = () => {
  const [step,    setStep]    = useState(0);
  const [origin,  setOrigin]  = useState(-1);
  const [roast,   setRoast]   = useState(1);
  const [pkg,     setPkg]     = useState(-1);
  const [design,  setDesign]  = useState(-1);
  const [volume,  setVolume]  = useState(100);

  const [origins,  setOrigins]  = useState<CalcOrigin[]>([]);
  const [params,   setParams]   = useState<CalcParams>(DEFAULT_PARAMS);
  const [usdRate,  setUsdRate]  = useState<number>(DEFAULT_USD);
  const [dataReady, setDataReady] = useState(false);

  const { openModal } = useLeadModal();

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } })
      .then(r => r.json())
      .then(d => {
        if (d.origins?.length) setOrigins(d.origins);
        if (d.params)          setParams(d.params);
        if (d.usd_rate)        setUsdRate(d.usd_rate);
      })
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  const canNext = (() => {
    if (step === 0) return origin >= 0;
    if (step === 2) return pkg    >= 0;
    if (step === 3) return design >= 0;
    return true;
  })();

  const selectedOrigin = origin >= 0 ? origins[origin] : null;

  // Цена за 1 кг по новой формуле (с учётом обжарки из ROASTS и упаковки/дизайна как надбавок)
  const roastExtra  = ROASTS[roast].extra;
  const pkgExtra    = pkg    >= 0 ? PACKAGINGS[pkg].extra   : 0;
  const designExtra = design >= 0 && !DESIGNS[design].soon ? DESIGNS[design].extra : 0;

  const basePerKg   = selectedOrigin ? calcPrice1kg(selectedOrigin, params, usdRate) : 0;
  const pricePerKg  = basePerKg + roastExtra + pkgExtra + designExtra;
  const discount    = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total       = selectedOrigin ? Math.round(volume * pricePerKg * (1 - discount)) : 0;
  const leadTime    = volume <= 200 ? 14 : volume <= 500 ? 18 : 25;
  const isLast      = step === 4;

  const goNext = () => { if (canNext && !isLast) setStep(s => s + 1); };

  return (
    <section id="calculator" className="py-24">
      <div className="max-w-5xl mx-auto px-6">

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
            dynamicOrigins={dataReady ? origins : undefined}
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
            dynamicOrigins={dataReady ? origins : undefined}
          />

        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;

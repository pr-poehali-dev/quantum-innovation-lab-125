import { useState, useEffect } from "react";
import { useLeadModal } from "@/context/LeadModalContext";
import CalculatorStepPanel from "./calculator/CalculatorStepPanel";
import CalculatorSummary from "./calculator/CalculatorSummary";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

export interface CalcOrigin {
  id: number;
  label: string;
  price_usd_per_kg: number;
  sort_order: number;
}

interface CalcParams {
  [key: string]: { value: number; label: string };
}

const DEFAULT_PARAMS: CalcParams = {
  roast_loss_percent:    { value: 15,  label: "Потеря веса при обжарке, %" },
  pkg_1kg:               { value: 50,  label: "Упаковка 1 кг" },
  transport_1kg:         { value: 15,  label: "Транспорт 1 кг" },
  production_1kg:        { value: 10,  label: "Производство 1 кг" },
  roasting_service_1kg:  { value: 100, label: "Услуги обжарки и упаковки 1 кг" },
  pkg_250g:              { value: 40,  label: "Упаковка 250 г" },
  transport_250g:        { value: 3.15, label: "Транспорт 250 г" },
  production_250g:       { value: 2.49, label: "Производство 250 г" },
  roasting_service_250g: { value: 30,  label: "Услуги обжарки и упаковки 250 г" },
};

const DEFAULT_USD = 85;
const DEFAULT_MIN_VOLUME = 500;
const DEFAULT_VOLUME_STEP = 5;

// Цена за 1 кг готовой продукции: зерно с учётом обжарки + упаковка + транспорт + производство + услуги
export function calcPrice1kg(origin: CalcOrigin, params: CalcParams, usd: number): number {
  const lossPercent = params["roast_loss_percent"]?.value ?? 15;
  const roastedPrice = (origin.price_usd_per_kg * usd) / (1 - lossPercent / 100);
  return Math.round(
    roastedPrice
    + (params["pkg_1kg"]?.value ?? 0)
    + (params["transport_1kg"]?.value ?? 0)
    + (params["production_1kg"]?.value ?? 0)
    + (params["roasting_service_1kg"]?.value ?? 0)
  );
}

// Цена за упаковку 250 г (итог не за кг, а за пачку весом 250г)
export function calcPrice250g(origin: CalcOrigin, params: CalcParams, usd: number): number {
  const lossPercent = params["roast_loss_percent"]?.value ?? 15;
  const roastedPrice = (origin.price_usd_per_kg * usd * 0.25) / (1 - lossPercent / 100);
  return Math.round(
    roastedPrice
    + (params["pkg_250g"]?.value ?? 0)
    + (params["transport_250g"]?.value ?? 0)
    + (params["production_250g"]?.value ?? 0)
    + (params["roasting_service_250g"]?.value ?? 0)
  );
}

const PriceCalculator = () => {
  const [step,         setStep]         = useState(0);
  const [origin,       setOrigin]       = useState(-1);
  const [roast,        setRoast]        = useState(1);
  const [weightFormat, setWeightFormat] = useState<"1kg" | "250g">("1kg");
  const [bagColor,     setBagColor]     = useState<"black" | "white" | "custom">("black");
  const [volume,       setVolume]       = useState(DEFAULT_MIN_VOLUME);

  const [origins,     setOrigins]     = useState<CalcOrigin[]>([]);
  const [params,      setParams]      = useState<CalcParams>(DEFAULT_PARAMS);
  const [usdRate,     setUsdRate]     = useState<number>(DEFAULT_USD);
  const [minVolume,   setMinVolume]   = useState<number>(DEFAULT_MIN_VOLUME);
  const [volumeStep,  setVolumeStep]  = useState<number>(DEFAULT_VOLUME_STEP);
  const [dataReady,   setDataReady]   = useState(false);

  const { openModal } = useLeadModal();

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } })
      .then(r => r.json())
      .then(d => {
        if (d.origins?.length) setOrigins(d.origins);
        if (d.params)          setParams(d.params);
        if (d.usd_rate)        setUsdRate(d.usd_rate);
        if (d.min_volume)      { setMinVolume(d.min_volume); setVolume(d.min_volume); }
        if (d.volume_step)     setVolumeStep(d.volume_step);
      })
      .catch(() => {})
      .finally(() => setDataReady(true));
  }, []);

  const canNext = (() => {
    if (step === 0) return origin >= 0;
    return true;
  })();

  const selectedOrigin = origin >= 0 ? origins[origin] : null;
  const isSmall = weightFormat === "250g";

  // Итог считаем по факту выбранной фасовки: для 1кг — цена*объём, для 250г — переводим объём(кг) в пачки
  const pricePerUnit = selectedOrigin
    ? (isSmall ? calcPrice250g(selectedOrigin, params, usdRate) : calcPrice1kg(selectedOrigin, params, usdRate))
    : 0;
  const packsCount   = isSmall ? Math.round((volume * 1000) / 250) : volume;
  const discount     = volume >= 2000 ? 0.1 : volume >= 1000 ? 0.05 : 0;
  const rawTotal      = selectedOrigin ? packsCount * pricePerUnit : 0;
  const total        = Math.round(rawTotal * (1 - discount));
  const pricePerKg   = volume > 0 ? Math.round(total / volume) : 0;
  const leadTime      = volume <= 1000 ? 14 : volume <= 2000 ? 18 : 25;
  const isLast        = step === 3;

  const goNext = () => { if (canNext && !isLast) setStep(s => s + 1); };

  const handleSubmitToManager = () => {
    openModal("calculator", {
      origin: selectedOrigin?.label,
      roast: ["Светлая", "Средняя", "Тёмная"][roast],
      weight_format: weightFormat === "250g" ? "250 г" : "1 кг",
      bag_color: bagColor,
      volume,
      total,
    });
  };

  return (
    <section id="calculator" className="py-24">
      <div className="max-w-5xl mx-auto px-6">

        <div className="scroll-reveal mb-10">
          <span className="text-xs font-mono text-primary tracking-wider">ПРОИЗВОДСТВЕННЫЙ БРИФ</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold">
            Рассчитайте стоимость<br />
            <span className="text-primary">своей партии</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg">
            Приходите со своим дизайном упаковки — детали обсудим с менеджером. Здесь считаем стоимость производства.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          <CalculatorStepPanel
            step={step}
            origin={origin}
            roast={roast}
            weightFormat={weightFormat}
            bagColor={bagColor}
            volume={volume}
            minVolume={minVolume}
            volumeStep={volumeStep}
            canNext={canNext}
            isLast={isLast}
            setStep={setStep}
            setOrigin={setOrigin}
            setRoast={setRoast}
            setWeightFormat={setWeightFormat}
            setBagColor={setBagColor}
            setVolume={setVolume}
            goNext={goNext}
            onSubmit={handleSubmitToManager}
            dynamicOrigins={dataReady ? origins : undefined}
          />

          <CalculatorSummary
            step={step}
            origin={origin}
            roast={roast}
            weightFormat={weightFormat}
            bagColor={bagColor}
            volume={volume}
            total={total}
            pricePerKg={pricePerKg}
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
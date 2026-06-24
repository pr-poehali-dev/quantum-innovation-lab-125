import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ABOUT_URL  = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";
const ADMIN_KEY  = "kontraktkafe-admin-2024";

interface Origin {
  id?: number;
  label: string;
  desc: string;
  price_usd: number;
  sort_order: number;
  _isNew?: boolean;
}

interface Params {
  [key: string]: { value: number; label: string };
}

const PARAM_ORDER = [
  "pkg_1kg", "transport_1kg", "production_1kg", "roasting_1kg", "weight_loss",
  "pkg_250g", "transport_250g", "production_250g", "roasting_250g",
];

const AdminCalc = () => {
  const [origins,      setOrigins]      = useState<Origin[]>([]);
  const [params,       setParams]       = useState<Params>({});
  const [usdRate,      setUsdRate]      = useState<number>(85);
  const [deleteIds,    setDeleteIds]    = useState<number[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } })
      .then(r => r.json())
      .then(d => {
        setOrigins(d.origins || []);
        setParams(d.params || {});
        setUsdRate(d.usd_rate || 85);
      })
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  }, []);

  const updateOrigin = (idx: number, field: keyof Origin, value: string | number) => {
    setOrigins(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const addOrigin = () => {
    setOrigins(prev => [...prev, { label: "", desc: "", price_usd: 0, sort_order: prev.length + 1, _isNew: true }]);
  };

  const removeOrigin = (idx: number) => {
    const o = origins[idx];
    if (o.id) setDeleteIds(prev => [...prev, o.id!]);
    setOrigins(prev => prev.filter((_, i) => i !== idx));
  };

  const updateParam = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: { ...prev[key], value: parseFloat(value) || 0 } }));
  };

  const save = async () => {
    setSaving(true);
    const paramsToSave: Record<string, number> = {};
    for (const k of Object.keys(params)) paramsToSave[k] = params[k].value;

    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY, "X-Action": "save-calc" },
        body: JSON.stringify({
          origins: origins.map((o, i) => ({ ...o, sort_order: i + 1 })),
          delete_origin_ids: deleteIds,
          params: paramsToSave,
        }),
      });
      if (r.ok) {
        setDeleteIds([]);
        showToast("Данные сохранены ✓");
        // обновить id новых записей
        const fresh = await fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } });
        const d = await fresh.json();
        setOrigins(d.origins || []);
      } else showToast("Ошибка сохранения", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setSaving(false); }
  };

  const previewPrice1kg = (o: Origin) => {
    const wl = params["weight_loss"]?.value ?? 0.15;
    return Math.round(
      (o.price_usd * usdRate / (1 - wl))
      + (params["pkg_1kg"]?.value ?? 0)
      + (params["transport_1kg"]?.value ?? 0)
      + (params["production_1kg"]?.value ?? 0)
      + (params["roasting_1kg"]?.value ?? 0)
    );
  };

  const previewPrice250g = (o: Origin) => {
    const wl = params["weight_loss"]?.value ?? 0.15;
    return Math.round(
      (o.price_usd * usdRate * 0.25 / (1 - wl))
      + (params["pkg_250g"]?.value ?? 0)
      + (params["transport_250g"]?.value ?? 0)
      + (params["production_250g"]?.value ?? 0)
      + (params["roasting_250g"]?.value ?? 0)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Calculator" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Калькулятор кофе</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-muted-foreground font-mono">
              USD = {usdRate} ₽
              <Link to="/admin/rate" className="ml-1.5 text-primary hover:underline">изменить →</Link>
            </span>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Icon name="Save" size={14} />
              }
              Сохранить
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "Check" : "X"} size={14} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Сорта зерна */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold">Сорта зерна</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Цена — стоимость зелёного зерна в $/кг</p>
                </div>
                <button
                  onClick={addOrigin}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 px-3 py-1.5 rounded-full transition-all"
                >
                  <Icon name="Plus" size={14} />
                  Добавить сорт
                </button>
              </div>

              <div className="space-y-2">
                {/* Шапка */}
                <div className="grid grid-cols-[2fr_2fr_1fr_auto] gap-3 px-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  <span>Название</span>
                  <span>Вкусовой профиль</span>
                  <span>$/кг</span>
                  <span />
                </div>

                {origins.map((o, idx) => (
                  <div key={o.id ?? `new-${idx}`} className="bg-card border border-border rounded-xl p-3 grid grid-cols-[2fr_2fr_1fr_auto] gap-3 items-center group">
                    <input
                      value={o.label}
                      onChange={e => updateOrigin(idx, "label", e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Название сорта"
                    />
                    <input
                      value={o.desc}
                      onChange={e => updateOrigin(idx, "desc", e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-muted-foreground"
                      placeholder="вкус, аромат..."
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">$</span>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={o.price_usd}
                        onChange={e => updateOrigin(idx, "price_usd", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden group-hover:block">
                        <p className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">1кг: {previewPrice1kg(o)} ₽</p>
                        <p className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">250г: {previewPrice250g(o)} ₽</p>
                      </div>
                      <button
                        onClick={() => removeOrigin(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Параметры расчёта */}
            <section>
              <h2 className="font-serif text-xl font-bold mb-1">Параметры расчёта</h2>
              <p className="text-sm text-muted-foreground mb-4">Затраты на упаковку, логистику и производство</p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Фасовка 1 кг */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-mono flex items-center justify-center">1</span>
                    Фасовка 1 кг
                  </h3>
                  <div className="space-y-3">
                    {["pkg_1kg", "transport_1kg", "production_1kg", "roasting_1kg"].map(key => (
                      params[key] && (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <label className="text-sm text-muted-foreground flex-1">{params[key].label.replace(", ₽", "")}</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={params[key].value}
                              onChange={e => updateParam(key, e.target.value)}
                              className="w-24 px-2 py-1 border border-border rounded-lg text-sm font-mono text-right focus:outline-none focus:border-primary transition-colors"
                            />
                            <span className="text-sm text-muted-foreground">₽</span>
                          </div>
                        </div>
                      )
                    ))}
                    {params["weight_loss"] && (
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                        <label className="text-sm text-muted-foreground flex-1">Потеря веса при обжарке</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={params["weight_loss"].value}
                            onChange={e => updateParam("weight_loss", e.target.value)}
                            className="w-20 px-2 py-1 border border-border rounded-lg text-sm font-mono text-right focus:outline-none focus:border-primary transition-colors"
                          />
                          <span className="text-sm text-muted-foreground">доля</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Фасовка 250 г */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-mono flex items-center justify-center">¼</span>
                    Фасовка 250 г
                  </h3>
                  <div className="space-y-3">
                    {["pkg_250g", "transport_250g", "production_250g", "roasting_250g"].map(key => (
                      params[key] && (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <label className="text-sm text-muted-foreground flex-1">{params[key].label.replace(", ₽", "")}</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={params[key].value}
                              onChange={e => updateParam(key, e.target.value)}
                              className="w-24 px-2 py-1 border border-border rounded-lg text-sm font-mono text-right focus:outline-none focus:border-primary transition-colors"
                            />
                            <span className="text-sm text-muted-foreground">₽</span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Превью формулы */}
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Icon name="Info" size={14} className="text-primary" />
                Формула расчёта
              </h3>
              <div className="space-y-1 text-[13px] font-mono text-muted-foreground">
                <p>1 кг: (цена$ × {usdRate} / {((1 - (params["weight_loss"]?.value ?? 0.15)) * 100).toFixed(0)}%) + упак + транспорт + произв + обжарка</p>
                <p>250 г: (цена$ × {usdRate} × 0.25 / {((1 - (params["weight_loss"]?.value ?? 0.15)) * 100).toFixed(0)}%) + упак₂₅₀ + транспорт₂₅₀ + произв₂₅₀ + обжарка₂₅₀</p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCalc;

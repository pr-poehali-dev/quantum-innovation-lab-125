import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";
const ADMIN_KEY = "kontraktkafe-admin-2024";

const AdminRate = () => {
  const [rate,      setRate]      = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-rate" } })
      .then(r => r.json())
      .then(d => {
        if (d.rate) setRate(String(d.rate));
        if (d.updated_at) setUpdatedAt(d.updated_at);
      })
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const num = parseFloat(rate.replace(",", "."));
    if (isNaN(num) || num <= 0) { showToast("Введите корректный курс", false); return; }
    setSaving(true);
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY, "X-Action": "save-rate" },
        body: JSON.stringify({ rate: num }),
      });
      const d = await r.json();
      if (r.ok) {
        showToast("Курс сохранён ✓");
        setRate(String(d.rate));
        setUpdatedAt(new Date().toISOString());
      } else showToast(d.error || "Ошибка сохранения", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setSaving(false); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
      + " в " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="DollarSign" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Курс доллара</span>
            </div>
          </div>
          <Link to="/" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            На сайт →
          </Link>
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

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold">Курс доллара</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Отображается в шапке сайта. Обновляйте раз в неделю — курс влияет на стоимость кофе.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Курс USD / ₽</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$1 =</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rate}
                      onChange={e => setRate(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && save()}
                      className="w-full pl-14 pr-10 py-2.5 border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary transition-colors"
                      placeholder="85.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">₽</span>
                  </div>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
                    Сохранить
                  </button>
                </div>
              </div>

              {updatedAt && (
                <p className="text-[12px] text-muted-foreground font-mono flex items-center gap-1.5">
                  <Icon name="Clock" size={12} />
                  Последнее обновление: {formatDate(updatedAt)}
                </p>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <Icon name="Info" size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Курс отображается в шапке сайта рядом с навигацией. Рекомендуем обновлять каждый понедельник — посетители видят актуальный курс и понимают ценообразование.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRate;

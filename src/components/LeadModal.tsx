import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import type { LeadModalSource } from "@/context/LeadModalContext";
import ConsentCheckbox, { useConsentEnabled } from "@/components/ConsentCheckbox";
import { useClientAuth } from "@/context/ClientAuthContext";
import { clearCart } from "@/lib/calcCore";
import { useContacts } from "@/lib/siteContent";
import func2url from "../../backend/func2url.json";

interface FieldProps {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  onChange: (val: string) => void;
}

const Field = ({ id, label, placeholder, type = "text", required, value, error, disabled, autoComplete, onChange }: FieldProps) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <input
      id={id} type={type} value={value} autoComplete={autoComplete}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border bg-secondary/50 text-base sm:text-sm outline-none transition-all focus:bg-card disabled:opacity-60 ${
        error ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary"
      }`}
    />
    {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
  </div>
);

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  source?: LeadModalSource;
  brief?: Record<string, unknown>;
}

type Step = "form" | "loading" | "success" | "error";

const HEADER_TEXTS = {
  eyebrow: "ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ",
  title: <>Рассчитаем стоимость<br />вашей партии</>,
  subtitle: "Оставьте телефон и почту — менеджер свяжется с вами",
};

const CALCULATOR_TEXTS = {
  eyebrow: "ЗАЯВКА НА СОГЛАСОВАНИЕ",
  title: <>Куда отправить<br />ваш расчёт?</>,
  subtitle: "Оставьте телефон и почту — менеджер подтвердит детали и свяжется с вами",
};

const phoneDigits = (v: string) => v.replace(/\D/g, "");

interface BriefPosition {
  origin: string; roast: string; weight_format: string; bag_color: string; volume: number; amount: number; custom_package?: boolean;
}

const LeadModal = ({ open, onClose, source = "header", brief }: LeadModalProps) => {
  const { client } = useClientAuth();
  const contacts = useContacts();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState({ phone: "", email: "" });
  const consentEnabled = useConsentEnabled();

  useEffect(() => {
    if (open && client) {
      setForm(f => ({ phone: f.phone || client.phone || "", email: f.email || client.email || "" }));
    }
  }, [open, client]);

  if (!open) return null;

  const texts = source === "calculator" ? CALCULATOR_TEXTS : HEADER_TEXTS;
  const positions = (brief?.positions as BriefPosition[] | undefined) ?? [];

  const setField = (id: keyof typeof form) => (val: string) => {
    setForm(f => ({ ...f, [id]: val }));
    setErrors(e => ({ ...e, [id]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (phoneDigits(form.phone).length < 10) e.phone = "Введите номер телефона полностью";
    if (!form.email.trim()) e.email = "Введите почту";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Проверьте адрес почты";
    if (consentEnabled && !agreed) e.consent = "Подтвердите согласие, чтобы отправить заявку";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep("loading");
    try {
      const res = await fetch(func2url.lead, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: client?.name || "",
          phone: form.phone.trim(),
          email: form.email.trim(),
          brief: brief ? { ...brief, source } : { source },
        }),
      });
      if (res.ok) {
        setSent({ phone: form.phone.trim(), email: form.email.trim() });
        if (source === "calculator") {
          clearCart();
          window.dispatchEvent(new Event("kk-cart-cleared"));
        }
        setStep("success");
      } else {
        setStep("error");
      }
    } catch {
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("form");
    setForm({ phone: "", email: "" });
    setErrors({});
    setAgreed(false);
    onClose();
  };

  const loading = step === "loading";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={handleClose} />

      <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="pointer-events-auto bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[94vh] overflow-y-auto">

          {(step === "form" || step === "loading") && (
            <>
              <div className="relative bg-primary px-6 sm:px-7 pt-6 sm:pt-7 pb-5 sm:pb-6">
                <button onClick={handleClose} aria-label="Закрыть"
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <Icon name="X" size={15} className="text-white" />
                </button>
                <p className="text-white/70 text-xs font-mono tracking-widest mb-1">{texts.eyebrow}</p>
                <h2 className="font-serif text-2xl font-bold text-white leading-tight pr-8">{texts.title}</h2>
                <p className="text-white/70 text-sm mt-2">{texts.subtitle}</p>
              </div>

              <div className="px-6 sm:px-7 py-5 sm:py-6 space-y-4">
                {source === "calculator" && positions.length > 0 && (
                  <div className="bg-secondary/50 rounded-xl px-4 py-3 text-[12px] text-muted-foreground space-y-1.5">
                    {positions.map((p, i) => (
                      <div key={i} className="flex justify-between gap-3">
                        <span className="truncate">{p.origin} · {p.volume.toLocaleString("ru-RU")} кг</span>
                        <span className="font-medium text-foreground flex-shrink-0">{Number(p.amount).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1.5 border-t border-border font-semibold text-foreground">
                      <span>Итого</span><span>{Number(brief?.total ?? 0).toLocaleString("ru-RU")} ₽</span>
                    </div>
                  </div>
                )}

                <Field id="phone" label="Телефон" placeholder="+7 (999) 000-00-00" required type="tel" autoComplete="tel"
                  value={form.phone} error={errors.phone} disabled={loading} onChange={setField("phone")} />
                <Field id="email" label="Почта" placeholder="ivan@cafe.ru" required type="email" autoComplete="email"
                  value={form.email} error={errors.email} disabled={loading} onChange={setField("email")} />

                <div>
                  <ConsentCheckbox checked={agreed} invalid={!!errors.consent}
                    onChange={v => { setAgreed(v); setErrors(e => ({ ...e, consent: "" })); }} />
                  {errors.consent && <p className="text-[11px] text-red-500 mt-1">{errors.consent}</p>}
                </div>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Отправляем...</>
                    : <><Icon name="Send" size={15} /> Отправить на согласование</>}
                </button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="px-6 sm:px-7 py-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
                <Icon name="CheckCircle" size={32} className="text-green-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Заказ отправлен на согласование</h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-5">
                Предварительно с вами свяжется менеджер по указанным контактным данным.
              </p>
              <div className="w-full bg-secondary/50 rounded-2xl p-4 text-left space-y-2.5 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Icon name="Phone" size={15} className="text-primary flex-shrink-0" />
                  <span className="font-medium break-all">{sent.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Icon name="Mail" size={15} className="text-primary flex-shrink-0" />
                  <span className="font-medium break-all">{sent.email}</span>
                </div>
                {contacts.work_hours && (
                  <div className="flex items-center gap-3 text-[12px] text-muted-foreground pt-2 border-t border-border">
                    <Icon name="Clock" size={13} className="flex-shrink-0" /> Время работы: {contacts.work_hours}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Link to="/cabinet" onClick={handleClose}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                  <Icon name="LogIn" size={15} /> Войти в личный кабинет
                </Link>
                <button onClick={handleClose}
                  className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="px-6 sm:px-7 py-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
                <Icon name="AlertCircle" size={32} className="text-red-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Не удалось отправить</h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Ваш расчёт сохранён. Попробуйте ещё раз или напишите нам: {contacts.email}
              </p>
              <button onClick={() => setStep("form")}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all">
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LeadModal;

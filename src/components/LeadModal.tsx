import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import type { LeadModalSource } from "@/context/LeadModalContext";
import ConsentCheckbox, { useConsentEnabled } from "@/components/ConsentCheckbox";
import func2url from "../../backend/func2url.json";

// ── Field вынесен наружу — иначе при каждом setState пересоздаётся и теряет фокус

interface FieldProps {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}

const Field = ({ id, label, placeholder, type = "text", required, value, error, disabled, onChange }: FieldProps) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border bg-secondary/50 text-sm outline-none transition-all focus:bg-card disabled:opacity-60 ${
        error ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary"
      }`}
    />
    {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
  </div>
);

// ── Модалка

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
  subtitle: "Оставьте контакты — менеджер свяжется в течение 30 минут",
};

const CALCULATOR_TEXTS = {
  eyebrow: "БРИФ ГОТОВ",
  title: <>Отправим ваш расчёт<br />менеджеру</>,
  subtitle: "Мы свяжемся с вами и подтвердим детали — либо оформите заказ самостоятельно в личном кабинете",
};

const LeadModal = ({ open, onClose, source = "header", brief }: LeadModalProps) => {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ name: "", city: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const consentEnabled = useConsentEnabled();

  if (!open) return null;

  const texts = source === "calculator" ? CALCULATOR_TEXTS : HEADER_TEXTS;

  const setField = (id: keyof typeof form) => (val: string) => {
    setForm(f => ({ ...f, [id]: val }));
    setErrors(e => ({ ...e, [id]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = "Введите имя";
    if (!form.phone.trim()) e.phone = "Введите телефон";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Неверный формат";
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
        body: JSON.stringify({ ...form, brief: brief ?? null }),
      });
      setStep(res.ok ? "success" : "error");
    } catch {
      setStep("error");
    }
  };

  const handleClose = () => {
    setStep("form");
    setForm({ name: "", city: "", phone: "", email: "" });
    setErrors({});
    setAgreed(false);
    onClose();
  };

  const loading = step === "loading";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={handleClose} />

      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

          {(step === "form" || step === "loading") && (
            <>
              <div className="relative bg-primary px-7 pt-7 pb-6">
                <button onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <Icon name="X" size={14} className="text-white" />
                </button>
                <p className="text-white/70 text-xs font-mono tracking-widest mb-1">{texts.eyebrow}</p>
                <h2 className="font-serif text-2xl font-bold text-white leading-tight">
                  {texts.title}
                </h2>
                <p className="text-white/60 text-sm mt-2">{texts.subtitle}</p>
              </div>

              <div className="px-7 py-6 space-y-4">
                {source === "calculator" && brief && (
                  <div className="bg-secondary/50 rounded-xl px-4 py-3 text-[12px] text-muted-foreground space-y-1">
                    {!!brief.origin && <div className="flex justify-between"><span>Зерно</span><span className="font-medium text-foreground">{String(brief.origin)}</span></div>}
                    {brief.volume !== undefined && <div className="flex justify-between"><span>Объём</span><span className="font-medium text-foreground">{String(brief.volume)} кг</span></div>}
                    {brief.total !== undefined && <div className="flex justify-between"><span>Итого</span><span className="font-medium text-foreground">{Number(brief.total).toLocaleString("ru-RU")} ₽</span></div>}
                  </div>
                )}

                <Field id="name"  label="Имя"     placeholder="Иван Петров"        required
                  value={form.name}  error={errors.name}  disabled={loading} onChange={setField("name")} />
                <Field id="phone" label="Телефон" placeholder="+7 (999) 000-00-00" required type="tel"
                  value={form.phone} error={errors.phone} disabled={loading} onChange={setField("phone")} />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="city"  label="Город"  placeholder="Москва"
                    value={form.city}  disabled={loading} onChange={setField("city")} />
                  <Field id="email" label="E-mail" placeholder="ivan@cafe.ru" type="email"
                    value={form.email} error={errors.email} disabled={loading} onChange={setField("email")} />
                </div>

                <div>
                  <ConsentCheckbox checked={agreed} invalid={!!errors.consent}
                    onChange={v => { setAgreed(v); setErrors(e => ({ ...e, consent: "" })); }} />
                  {errors.consent && <p className="text-[11px] text-red-500 mt-1">{errors.consent}</p>}
                </div>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Отправляем...</>
                    : <><Icon name="Send" size={15} /> Отправить менеджеру</>
                  }
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground">или</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {source === "calculator" ? (
                  <Link to="/cabinet" onClick={handleClose}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/3 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                        <Icon name="LogIn" size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Войти в ЛК и оформить самому</p>
                        <p className="text-[11px] text-muted-foreground">Соберите заказ без менеджера</p>
                      </div>
                    </div>
                    <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ) : (
                  <a href="#calculator" onClick={handleClose}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/3 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                        <Icon name="Calculator" size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Рассчитать стоимость самостоятельно</p>
                        <p className="text-[11px] text-muted-foreground">Заполните бриф за 3 минуты</p>
                      </div>
                    </div>
                    <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )}

              </div>
            </>
          )}

          {step === "success" && (
            <div className="px-7 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
                <Icon name="CheckCircle" size={32} className="text-green-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Заявка отправлена!</h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Менеджер свяжется с вами в течение 30 минут. Хотите оформить заказ сами — переходите в личный кабинет.
              </p>
              <div className="flex flex-col gap-3 w-full">
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
            <div className="px-7 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
                <Icon name="AlertCircle" size={32} className="text-red-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Не удалось отправить</h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Попробуйте ещё раз или напишите нам: info@kontraktkafe.ru
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
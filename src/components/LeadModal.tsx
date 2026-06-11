import { useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  brief?: Record<string, unknown>;
}

type Step = "form" | "loading" | "success" | "error";

const LeadModal = ({ open, onClose, brief }: LeadModalProps) => {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ name: "", city: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = "Введите имя";
    if (!form.phone.trim()) e.phone = "Введите телефон";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Неверный формат";
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
      if (res.ok) {
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
    setForm({ name: "", city: "", phone: "", email: "" });
    setErrors({});
    onClose();
  };

  const Field = ({
    id, label, placeholder, type = "text", required = false,
  }: { id: keyof typeof form; label: string; placeholder: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <input
        type={type}
        value={form[id]}
        onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: "" })); }}
        placeholder={placeholder}
        disabled={step === "loading"}
        className={`w-full px-4 py-3 rounded-xl border bg-secondary/50 text-sm outline-none transition-all focus:bg-card disabled:opacity-60 ${
          errors[id] ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary"
        }`}
      />
      {errors[id] && <p className="text-[11px] text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={handleClose} />

      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

          {/* Форма */}
          {(step === "form" || step === "loading") && (
            <>
              <div className="relative bg-primary px-7 pt-7 pb-6">
                <button onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <Icon name="X" size={14} className="text-white" />
                </button>
                <p className="text-white/70 text-xs font-mono tracking-widest mb-1">ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ</p>
                <h2 className="font-serif text-2xl font-bold text-white leading-tight">
                  Рассчитаем стоимость<br />вашей партии
                </h2>
                <p className="text-white/60 text-sm mt-2">Оставьте контакты — менеджер свяжется в течение 30 минут</p>
              </div>

              <div className="px-7 py-6 space-y-4">
                <Field id="name"  label="Имя"     placeholder="Иван Петров"        required />
                <Field id="phone" label="Телефон" placeholder="+7 (999) 000-00-00" required type="tel" />
                <div className="grid grid-cols-2 gap-3">
                  <Field id="city"  label="Город"  placeholder="Москва" />
                  <Field id="email" label="E-mail" placeholder="ivan@cafe.ru" type="email" />
                </div>

                <button onClick={handleSubmit} disabled={step === "loading"}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70">
                  {step === "loading"
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Отправляем...</>
                    : <><Icon name="Send" size={15} /> Отправить заявку</>
                  }
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground">или</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <a href="#calculator" onClick={handleClose}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-primary/3 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                      <Icon name="Calculator" size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Заполнить бриф самому</p>
                      <p className="text-[11px] text-muted-foreground">Рассчитайте цену за 3 минуты</p>
                    </div>
                  </div>
                  <Icon name="ArrowRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                <p className="text-[10px] text-muted-foreground text-center">
                  Нажимая «Отправить», вы соглашаетесь с политикой конфиденциальности
                </p>
              </div>
            </>
          )}

          {/* Успех */}
          {step === "success" && (
            <div className="px-7 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-5">
                <Icon name="CheckCircle" size={32} className="text-green-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Заявка отправлена!</h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Менеджер свяжется с вами в течение 30 минут. Пока ждёте — заполните производственный бриф.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <a href="#calculator" onClick={handleClose}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                  <Icon name="Calculator" size={15} /> Заполнить бриф
                </a>
                <button onClick={handleClose}
                  className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {step === "error" && (
            <div className="px-7 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
                <Icon name="AlertCircle" size={32} className="text-red-500" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Не удалось отправить</h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
                Попробуйте ещё раз или напишите нам напрямую: info@kontraktkafe.ru
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

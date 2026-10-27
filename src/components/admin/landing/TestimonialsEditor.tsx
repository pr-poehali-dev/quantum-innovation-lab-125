import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Testimonial } from "@/components/admin/landing/landingTypes";

interface TestEditorProps {
  testimonials: Testimonial[];
  onSave: (t: Partial<Testimonial>) => void;
  onDelete: (id: number) => void;
  inputCls: string;
  labelCls: string;
}

const TestimonialsEditor = ({ testimonials, onSave, onDelete, inputCls }: TestEditorProps) => {
  const [drafts, setDrafts] = useState<Record<number, Testimonial>>({});
  const [newQuote, setNewQuote] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newRole, setNewRole] = useState("");

  const getDraft = (t: Testimonial) => drafts[t.id] || t;
  const updateDraft = (t: Testimonial, patch: Partial<Testimonial>) =>
    setDrafts(prev => ({ ...prev, [t.id]: { ...getDraft(t), ...patch } }));

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <p className="text-sm font-semibold">Новый отзыв</p>
        <textarea className={inputCls} rows={2} placeholder="Текст отзыва" value={newQuote} onChange={e => setNewQuote(e.target.value)} />
        <div className="grid md:grid-cols-2 gap-2">
          <input className={inputCls} placeholder="Имя автора" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
          <input className={inputCls} placeholder="Должность, компания" value={newRole} onChange={e => setNewRole(e.target.value)} />
        </div>
        <button
          onClick={() => { onSave({ quote: newQuote, author: newAuthor, role: newRole, sort_order: testimonials.length + 1, active: true }); setNewQuote(""); setNewAuthor(""); setNewRole(""); }}
          disabled={!newQuote.trim() || !newAuthor.trim()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
          <Icon name="Plus" size={14} /> Добавить отзыв
        </button>
      </div>

      {testimonials.map(t => {
        const draft = getDraft(t);
        return (
          <div key={t.id} className={`bg-card border border-border rounded-2xl p-5 space-y-2 ${!draft.active ? "opacity-50" : ""}`}>
            <textarea className={inputCls} rows={2} value={draft.quote} onChange={e => updateDraft(t, { quote: e.target.value })} />
            <div className="grid md:grid-cols-2 gap-2">
              <input className={inputCls} value={draft.author} onChange={e => updateDraft(t, { author: e.target.value })} />
              <input className={inputCls} value={draft.role} onChange={e => updateDraft(t, { role: e.target.value })} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={draft.active} onChange={e => updateDraft(t, { active: e.target.checked })} />
                Показывать на сайте
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => onSave(draft)}
                  className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all">
                  <Icon name="Save" size={13} /> Сохранить
                </button>
                <button onClick={() => onDelete(t.id)}
                  className="flex items-center gap-1.5 text-[13px] text-destructive hover:text-destructive/80 font-medium px-3 py-1.5 rounded-lg hover:bg-destructive/5 transition-all">
                  <Icon name="Trash2" size={13} /> Удалить
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TestimonialsEditor;

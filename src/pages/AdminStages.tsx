import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

interface Stage {
  id: number;
  name: string;
  sort_order: number;
  color: string;
  progress_percent: number | null;
}

const COLORS = ["#64748b", "#0ea5e9", "#8b5cf6", "#f59e0b", "#22c55e", "#16a34a", "#ef4444", "#ec4899"];

const AdminStages = () => {
  const { token } = useStaffAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    fetch(CRM_URL, { headers: { "X-Action": "list-stages", "X-Staff-Token": token || "" } })
      .then(r => r.json())
      .then(d => setStages(d.stages || []))
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]);

  const updateStage = async (stage: Stage) => {
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-stage", "X-Staff-Token": token || "" },
        body: JSON.stringify(stage),
      });
      if (!r.ok) { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const patchLocal = (id: number, patch: Partial<Stage>) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const saveStage = (id: number) => {
    const stage = stages.find(s => s.id === id);
    if (stage) updateStage(stage);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((s, i) => { s.sort_order = i + 1; });
    setStages(next);
    next.forEach(s => updateStage(s));
  };

  const addStage = async () => {
    if (!newName.trim()) return;
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-stage", "X-Staff-Token": token || "" },
        body: JSON.stringify({ name: newName.trim(), color: COLORS[stages.length % COLORS.length] }),
      });
      if (r.ok) { setNewName(""); load(); showToast("Этап добавлен ✓"); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const deleteStage = async (id: number) => {
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "delete-stage", "X-Staff-Token": token || "" },
        body: JSON.stringify({ id }),
      });
      if (r.ok) { load(); showToast("Этап удалён ✓"); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/crm" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="GitBranch" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Этапы сделки</span>
            </div>
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

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold">Этапы сделки</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Воронка отображается в карточке клиента и в личном кабинете клиента
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((s, idx) => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                    <Icon name="ChevronUp" size={14} />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === stages.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                    <Icon name="ChevronDown" size={14} />
                  </button>
                </div>

                <span className="text-[11px] font-mono text-muted-foreground w-5 flex-shrink-0">{idx + 1}</span>

                <div className="flex gap-1 flex-shrink-0">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => { patchLocal(s.id, { color: c }); }}
                      onBlur={() => saveStage(s.id)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${s.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                      onMouseUp={() => saveStage(s.id)}
                    />
                  ))}
                </div>

                <input
                  value={s.name}
                  onChange={e => patchLocal(s.id, { name: e.target.value })}
                  onBlur={() => saveStage(s.id)}
                  className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                />

                <div className="flex items-center gap-1 flex-shrink-0" title="Процент готовности партии на этом этапе (показывается клиенту)">
                  <input
                    type="number" min={0} max={100}
                    value={s.progress_percent ?? ""}
                    placeholder="—"
                    onChange={e => patchLocal(s.id, { progress_percent: e.target.value === "" ? null : Number(e.target.value) })}
                    onBlur={() => saveStage(s.id)}
                    className="w-14 px-2 py-1.5 border border-border rounded-lg text-sm text-center focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">%</span>
                </div>

                <button onClick={() => deleteStage(s.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-3">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addStage()}
                className="flex-1 px-3 py-2.5 border border-dashed border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Название нового этапа"
              />
              <button
                onClick={addStage}
                className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/70 transition-all active:scale-95"
              >
                <Icon name="Plus" size={14} />
                Добавить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStages;
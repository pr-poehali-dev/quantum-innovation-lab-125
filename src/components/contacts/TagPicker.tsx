import { useState } from "react";
import Icon from "@/components/ui/icon";
import TagBadge from "@/components/contacts/TagBadge";
import { CONTACTS_URL, TAG_COLORS, type Tag } from "@/lib/contactsApi";

interface Props {
  tags: Tag[];
  selected: number[];
  onChange: (ids: number[]) => void;
  authHeaders: Record<string, string>;
  onTagsChanged: () => void;
}

const TagPicker = ({ tags, selected, onChange, authHeaders, onTagsChanged }: Props) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("green");
  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  const create = async () => {
    if (!name.trim()) return;
    const r = await fetch(CONTACTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Action": "save-tag", ...authHeaders },
      body: JSON.stringify({ name, color }),
    });
    const d = await r.json();
    if (r.ok) { setName(""); onTagsChanged(); if (!selected.includes(d.id)) onChange([...selected, d.id]); }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {tags.map(t => <TagBadge key={t.id} tag={t} active={selected.includes(t.id)} onClick={() => toggle(t.id)} />)}
      </div>
      <div className="flex gap-1.5 items-center">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()} placeholder="Новый тег"
          className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm bg-background" />
        <select value={color} onChange={e => setColor(e.target.value)} className={`px-2 py-1.5 rounded-lg text-xs border border-border ${TAG_COLORS[color]}`}>
          {Object.keys(TAG_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={create} className="p-2 bg-primary text-primary-foreground rounded-lg"><Icon name="Plus" size={14} /></button>
      </div>
    </div>
  );
};

export default TagPicker;

import { useEffect, useState } from "react";
import ContactButton from "@/components/ContactButton";
import { ABOUT_URL, useSection } from "@/lib/siteContent";
import { initialsOf, memberName, type TeamMember } from "@/lib/contactTypes";

interface TeamMeta {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
}

const DEFAULT_META: TeamMeta = {
  enabled: true,
  eyebrow: "КОМАНДА",
  title: "Люди, которые ведут ваш заказ",
  subtitle: "Свяжитесь с нами удобным способом",
};

const TeamSection = () => {
  const meta = useSection<TeamMeta>("team", DEFAULT_META);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-team" } })
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => {});
  }, []);

  if (!meta.enabled || members.length === 0) return null;

  return (
    <section id="team" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10 scroll-reveal">
          <span className="text-[11px] font-mono text-black/40 tracking-widest">{meta.eyebrow}</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3 leading-tight">{meta.title}</h2>
          {meta.subtitle && <p className="text-sm text-black/50 mt-2 max-w-xl">{meta.subtitle}</p>}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => {
            const name = memberName(m);
            return (
              <div key={m.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={name} loading="lazy" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {initialsOf(name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-bold leading-tight">{name}</p>
                    {m.position && <p className="text-[13px] text-primary font-medium mt-0.5">{m.position}</p>}
                  </div>
                </div>
                {m.description && (
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">{m.description}</p>
                )}
                {m.contacts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {m.contacts.map((c, i) => <ContactButton key={i} item={c} variant="icon" />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;

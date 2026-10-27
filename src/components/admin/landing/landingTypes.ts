import type { StatItem } from "@/components/admin/landing/StatsEditor";

export type Tab = "hero" | "workflow" | "about" | "features" | "cta" | "contacts" | "team" | "consent" | "footer" | "testimonials";

export interface HeroData {
  title_line1: string; title_line2: string; title_line3: string;
  subtitle: string;
  stat1_val: string; stat1_label: string;
  stat2_val: string; stat2_label: string;
  stat3_val: string; stat3_label: string;
  badge1_title: string; badge1_sub: string;
  badge2_title: string; badge2_sub: string;
}

export interface WorkflowStep { number: string; icon: string; title: string; sub: string; desc: string; badge: string | null }
export interface WorkflowData { eyebrow: string; title_line1: string; title_line2: string; subtitle: string; steps: WorkflowStep[] }

export interface Advantage { icon: string; title: string; short: string; detail: string; tag: string }
export interface Segment { name: string; icon: string }

export interface FeaturesData {
  advantages: Advantage[]; segments: Segment[];
  eyebrow?: string; title_line1?: string; title_line2?: string; segments_label?: string; stats?: StatItem[];
}

export interface AboutStatsData { eyebrow: string; status_label: string; button_label: string; stats: StatItem[] }
export interface TeamMeta { enabled: boolean; eyebrow: string; title: string; subtitle: string }

export interface PageOption { slug: string; title: string }

export interface FooterData {
  phone: string; email: string; telegram: string; description: string;
  status_title: string; status_line1: string; status_line2: string; copyright: string;
}

export interface Testimonial { id: number; quote: string; author: string; role: string; sort_order: number; active: boolean }
export interface CtaData { eyebrow: string; title_line1: string; title_line2: string; subtitle: string }

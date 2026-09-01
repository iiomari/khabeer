import {
  BadgeCheck,
  Briefcase,
  ClipboardList,
  Cpu,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  Landmark,
  Lightbulb,
  Megaphone,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  HardHat,
  Landmark,
  Users,
  Scale,
  Cpu,
  ShieldCheck,
  ClipboardList,
  Megaphone,
  TrendingUp,
  GraduationCap,
  BadgeCheck,
  Truck,
  HeartPulse,
  Zap,
  Factory,
  Lightbulb,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

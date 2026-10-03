import {
  Brush,
  Eye,
  Flame,
  Flower2,
  Footprints,
  Gem,
  Hand,
  PenTool,
  Scissors,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  "scissors-men": Scissors,
  hand: Hand,
  footprints: Footprints,
  flame: Flame,
  brush: Brush,
  "pen-tool": PenTool,
  eye: Eye,
  flower: Flower2,
  gem: Gem,
  sparkles: Sparkles,
};

export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden strokeWidth={1.5} />;
}

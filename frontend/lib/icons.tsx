import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Crown,
  Dices,
  Gamepad2,
  Gem,
  Handshake,
  Hexagon,
  LogOut,
  Medal,
  MessageCircle,
  Pencil,
  Scale,
  Search,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";

export const TraitIcon: Record<string, LucideIcon> = {
  skill: Swords,
  teamwork: Handshake,
  communication: MessageCircle,
  reliability: Target,
  attitude: Brain,
};

export const BadgeIcon: Record<string, LucideIcon> = {
  none: Sparkles,
  gold: Medal,
  trusted: BadgeCheck,
  average: Scale,
  mixed: AlertTriangle,
  caution: CircleAlert,
};

export const GameIcon: Record<string, LucideIcon> = {
  lol: Swords,
  "teamfight-tactics": Dices,
};

export const TierIcon: Record<string, LucideIcon> = {
  IRON: Hexagon,
  BRONZE: Medal,
  SILVER: Medal,
  GOLD: Medal,
  PLATINUM: Gem,
  EMERALD: Gem,
  DIAMOND: Gem,
  MASTER: Sparkles,
  GRANDMASTER: Trophy,
  CHALLENGER: Crown,
};

export {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  LogOut,
  Pencil,
  Search,
  Shield,
  Star,
  XCircle,
  Zap,
};

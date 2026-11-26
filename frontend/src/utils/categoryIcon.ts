import {
  BatteryCharging,
  Cable,
  Camera,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Mic,
  Monitor,
  Mouse,
  Plug,
  Smartphone,
  Speaker,
  Tablet,
  Watch,
  type LucideIcon,
} from "lucide-react";

// Order matters: "headphone" must be checked before "phone".
const KEYWORDS: Array<[string, LucideIcon]> = [
  ["mouse", Mouse],
  ["keyboard", Keyboard],
  ["headphone", Headphones],
  ["earphone", Headphones],
  ["earbud", Headphones],
  ["airpod", Headphones],
  ["watch", Watch],
  ["phone", Smartphone],
  ["mobile", Smartphone],
  ["tablet", Tablet],
  ["laptop", Laptop],
  ["monitor", Monitor],
  ["computer", Monitor],
  ["camera", Camera],
  ["speaker", Speaker],
  ["audio", Speaker],
  ["charger", BatteryCharging],
  ["battery", BatteryCharging],
  ["power", BatteryCharging],
  ["cable", Cable],
  ["storage", HardDrive],
  ["gaming", Gamepad2],
  ["game", Gamepad2],
  ["mic", Mic],
  ["accessor", Plug],
];

// Picks a gadget icon from the category name; falls back to a chip icon.
export const getCategoryIcon = (name: string): LucideIcon => {
  const lower = name.toLowerCase();
  const match = KEYWORDS.find(([keyword]) => lower.includes(keyword));
  return match ? match[1] : Cpu;
};

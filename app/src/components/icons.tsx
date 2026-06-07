import React from 'react';
import {
  BookOpen, CalendarDays, Camera, Car, CircleDollarSign, ClipboardCheck, ClipboardList,
  Clock, CookingPot, Ellipsis, HandCoins, Heart, House, Lightbulb, Mic, PawPrint, Plus,
  Recycle, Settings, Shirt, ShoppingBag, Sparkles, Wrench, X,
} from 'lucide-react-native';
import { colors } from '../theme/tokens';

// Semantic icon names — design doc §1.3 (rounded line icons, Lucide-style).
// The app never imports the icon library outside this file, so swapping it later
// is a one-file change. Names are meaning-based, not library-based.
export type IconName =
  | 'sparkles' | 'cooking' | 'shirt' | 'recycle' | 'car' | 'clipboard' | 'bulb'
  | 'heart' | 'paw' | 'wrench' | 'bag' | 'book' | 'dots'
  | 'house' | 'calendar' | 'dollar' | 'plus' | 'gear' | 'x' | 'clock' | 'coins'
  | 'clipboard-check' | 'camera' | 'mic';

const MAP: Record<IconName, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  sparkles: Sparkles, cooking: CookingPot, shirt: Shirt, recycle: Recycle, car: Car,
  clipboard: ClipboardList, bulb: Lightbulb, heart: Heart, paw: PawPrint, wrench: Wrench,
  bag: ShoppingBag, book: BookOpen, dots: Ellipsis,
  house: House, calendar: CalendarDays, dollar: CircleDollarSign, plus: Plus,
  gear: Settings, x: X, clock: Clock, coins: HandCoins,
  'clipboard-check': ClipboardCheck, camera: Camera, mic: Mic,
};

export function Icon({ name, size = 20, color = colors.charcoal, strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const C = MAP[name];
  return <C size={size} color={color} strokeWidth={strokeWidth} />;
}

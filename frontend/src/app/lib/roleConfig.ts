import {
  Home,
  Beef,
  MapPin,
  Store,
  TrendingUp,
  Heart,
  FileText,
  Receipt,
  Building2,
  Bell,
  ShieldCheck,
  Users,
  Activity,
  ClipboardList,
  Stethoscope,
  Scale,
  Search,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { ApiUserRole } from "./api/types";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  id: string;
}

export interface RoleConfig {
  label: string;
  accentColor: string;
  defaultPage: string;
  navItems: NavItem[];
}

const roleConfigs: Record<ApiUserRole, RoleConfig> = {
  farmer: {
    label: "Farmer",
    accentColor: "text-green-600",
    defaultPage: "dashboard",
    navItems: [
      { icon: Home, label: "Dashboard", id: "dashboard" },
      { icon: Beef, label: "My Animals", id: "animals" },
      { icon: MapPin, label: "My Holdings", id: "holdings" },
      { icon: Store, label: "Marketplace", id: "marketplace" },
      { icon: TrendingUp, label: "Movements", id: "movements" },
      { icon: Heart, label: "Health Records", id: "health" },
      { icon: Receipt, label: "Transactions", id: "transactions" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  vet: {
    label: "Veterinarian",
    accentColor: "text-blue-600",
    defaultPage: "health",
    navItems: [
      { icon: Stethoscope, label: "Health Records", id: "health" },
      { icon: Beef, label: "Animal Registry", id: "animals" },
      { icon: Activity, label: "Disease Reports", id: "reports" },
      { icon: MapPin, label: "Holdings", id: "holdings" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  cahw: {
    label: "Animal Health Worker",
    accentColor: "text-teal-600",
    defaultPage: "health",
    navItems: [
      { icon: Heart, label: "Health Records", id: "health" },
      { icon: Beef, label: "Animal Lookup", id: "animals" },
      { icon: MapPin, label: "Holdings", id: "holdings" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  dvs: {
    label: "DVS Officer",
    accentColor: "text-purple-600",
    defaultPage: "dvs-officer",
    navItems: [
      { icon: ShieldCheck, label: "DVS Dashboard", id: "dvs-officer" },
      { icon: TrendingUp, label: "Movement Permits", id: "movements" },
      { icon: MapPin, label: "Holdings", id: "holdings" },
      { icon: Beef, label: "Animal Registry", id: "animals" },
      { icon: BarChart3, label: "County Reports", id: "reports" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  inspector: {
    label: "Inspector",
    accentColor: "text-orange-600",
    defaultPage: "movements",
    navItems: [
      { icon: ClipboardList, label: "Movement Permits", id: "movements" },
      { icon: MapPin, label: "Holdings", id: "holdings" },
      { icon: Beef, label: "Animal Registry", id: "animals" },
      { icon: FileText, label: "Reports", id: "reports" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  buyer: {
    label: "Buyer",
    accentColor: "text-amber-600",
    defaultPage: "marketplace",
    navItems: [
      { icon: Store, label: "Marketplace", id: "marketplace" },
      { icon: Search, label: "Animal Lookup", id: "animals" },
      { icon: Receipt, label: "My Transactions", id: "transactions" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  abattoir: {
    label: "Abattoir",
    accentColor: "text-red-600",
    defaultPage: "abattoirs",
    navItems: [
      { icon: Building2, label: "Abattoir Dashboard", id: "abattoirs" },
      { icon: Scale, label: "Slaughter Records", id: "abattoirs" },
      { icon: Beef, label: "Verify Animals", id: "animals" },
      { icon: TrendingUp, label: "Incoming Movements", id: "movements" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },

  admin: {
    label: "Administrator",
    accentColor: "text-gray-700",
    defaultPage: "dashboard",
    navItems: [
      { icon: Home, label: "Dashboard", id: "dashboard" },
      { icon: Beef, label: "Animals", id: "animals" },
      { icon: MapPin, label: "Holdings", id: "holdings" },
      { icon: Store, label: "Marketplace", id: "marketplace" },
      { icon: TrendingUp, label: "Movements", id: "movements" },
      { icon: Heart, label: "Health Records", id: "health" },
      { icon: Receipt, label: "Transactions", id: "transactions" },
      { icon: Building2, label: "Abattoirs", id: "abattoirs" },
      { icon: ShieldCheck, label: "DVS Officer", id: "dvs-officer" },
      { icon: Users, label: "Users", id: "settings" },
      { icon: FileText, label: "Reports", id: "reports" },
      { icon: Bell, label: "Notifications", id: "notifications" },
    ],
  },
};

export function getRoleConfig(role: ApiUserRole | undefined): RoleConfig {
  if (!role || !(role in roleConfigs)) return roleConfigs.farmer;
  return roleConfigs[role];
}

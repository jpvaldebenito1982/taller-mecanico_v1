import {
  Home,
  Users,
  Car,
  ClipboardList,
  FileText,
  Package,
  CreditCard,
  IdCard,
} from "lucide-react";

export const sidebarItems = [
  { label: "Inicio", href: "/dashboard", icon: Home },
  { label: "Usuarios", href: "/dashboard/users", icon: Users },

  // ✅ Nuevo módulo
  { label: "Clientes", href: "/dashboard/customers", icon: IdCard },

  { label: "Vehículos", href: "/dashboard/vehicles", icon: Car },
  { label: "Órdenes", href: "/dashboard/orders", icon: ClipboardList },
  { label: "Presupuestos", href: "/dashboard/quotes", icon: FileText },
  { label: "Inventario", href: "/dashboard/inventory", icon: Package },
  { label: "Facturación", href: "/dashboard/billing", icon: CreditCard },
];
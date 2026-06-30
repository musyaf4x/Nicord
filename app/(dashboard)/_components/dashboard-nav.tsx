"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SideNav,
  SideNavItem,
  SideNavSection,
  SideNavHeading,
} from "@astryxdesign/core";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  BarChart2,
  Archive,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produk", href: "/products", icon: Package },
  { label: "Pelanggan", href: "/customers", icon: Users },
  { label: "Order", href: "/orders", icon: ShoppingCart },
  { label: "Piutang", href: "/payments", icon: CreditCard },
  { label: "Stok", href: "/stock", icon: Archive },
  { label: "Laporan", href: "/reports", icon: BarChart2 },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SideNav
      header={
        <SideNavHeading
          heading="Nicord"
          headingHref="/dashboard"
        />
      }
      collapsible={{ defaultIsCollapsed: false, hasButton: true }}
      footer={
        <SideNavItem
          label="Pengaturan"
          href="/settings"
          icon={Settings as React.ComponentType<React.SVGProps<SVGSVGElement>>}
          isSelected={pathname.startsWith("/settings")}
        />
      }
      footerIcons={
        <SideNavItem
          label="Keluar"
          icon={LogOut as React.ComponentType<React.SVGProps<SVGSVGElement>>}
          onClick={() => signOut({ callbackUrl: "/login" })}
        />
      }
    >
      <SideNavSection title="Menu" isHeaderHidden>
        {NAV_ITEMS.map((item) => (
          <SideNavItem
            key={item.href}
            label={item.label}
            href={item.href}
            as={Link}
            icon={item.icon as React.ComponentType<React.SVGProps<SVGSVGElement>>}
            isSelected={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </SideNavSection>
    </SideNav>
  );
}

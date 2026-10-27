export type NavItem = { href: string; label: string; icon: string; exact?: boolean };

export const APP_NAV: { section?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/app", label: "Dashboard", icon: "LayoutDashboard", exact: true },
      { href: "/app/tools", label: "Digital Tools", icon: "Wrench" },
      { href: "/app/marketplace", label: "Marketplace", icon: "ShoppingBag" },
      { href: "/app/library", label: "My Library", icon: "Library" },
      { href: "/app/resources", label: "Resources", icon: "BookOpen" },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/app/orders", label: "Orders", icon: "Receipt" },
      { href: "/app/membership", label: "Membership", icon: "Crown" },
      { href: "/app/referrals", label: "Referral Centre", icon: "Share2" },
      { href: "/app/settings", label: "Settings", icon: "Settings" },
    ],
  },
];

export const ADMIN_NAV: { section?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/admin", label: "Overview", icon: "LayoutDashboard", exact: true },
      { href: "/admin/reports", label: "Reports", icon: "BarChart3" },
    ],
  },
  {
    section: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: "Package" },
      { href: "/admin/categories", label: "Categories", icon: "FolderTree" },
      { href: "/admin/plans", label: "Membership plans", icon: "Crown" },
    ],
  },
  {
    section: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "Receipt" },
      { href: "/admin/refunds", label: "Refunds", icon: "RotateCcw" },
      { href: "/admin/members", label: "Members", icon: "Users" },
    ],
  },
  {
    section: "Affiliate",
    items: [
      { href: "/admin/affiliate", label: "Programme settings", icon: "SlidersHorizontal" },
      { href: "/admin/commissions", label: "Commission ledger", icon: "CircleDollarSign" },
      { href: "/admin/payouts", label: "Payout review", icon: "Banknote" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/settings", label: "Platform settings", icon: "Settings" },
      { href: "/admin/audit", label: "Audit log", icon: "ScrollText" },
    ],
  },
];

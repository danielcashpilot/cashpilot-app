"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarsIcon, ChatIcon, HomeIcon, PlusIcon } from "./icons";

const items = [
  { href: "/", label: "בית", Icon: HomeIcon },
  { href: "/upload", label: "הוספה", Icon: PlusIcon },
  { href: "/compare", label: "מעקב", Icon: BarsIcon },
  { href: "/chat", label: "צ'אט", Icon: ChatIcon },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex h-[72px] w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-line bg-card">
      {items.map(({ href, label, Icon }) => {
        const active = href === "/" ? path === "/" || path === "/payslip" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-[60px] flex-col items-center justify-center gap-[3px] text-xs ${active ? "text-link" : "text-muted"}`}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

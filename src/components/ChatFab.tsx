import Link from "next/link";
import { ChatIcon } from "./icons";

export default function ChatFab({ label = "שאל" }: { label?: string }) {
  return (
    <Link
      href="/chat"
      className="fixed bottom-[90px] z-20 flex h-[50px] items-center gap-2 rounded-full bg-btn px-[18px] text-[15px] font-medium text-btn-ink shadow-sm"
      style={{ left: "max(18px, calc(50% - 215px + 18px))" }}
    >
      <ChatIcon size={20} />
      {label}
    </Link>
  );
}

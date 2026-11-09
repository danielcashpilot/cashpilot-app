import BottomNav from "@/components/BottomNav";
import ChatFab from "@/components/ChatFab";
import PayslipView from "@/components/PayslipView";

export default function Payslip() {
  return (
    <>
      <PayslipView />
      <ChatFab label="שאל על התלוש" />
      <BottomNav />
    </>
  );
}

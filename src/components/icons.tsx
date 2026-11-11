type P = { size?: number };
const base = { "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" } as const;

export const HomeIcon = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size} strokeLinejoin="round"><path d="M3 11l9-7 9 7v9H15v-6H9v6H3z" /></svg>
);
export const PlusIcon = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
export const BarsIcon = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round"><path d="M5 20V11M12 20V5M19 20v-6" /></svg>
);
export const ChatIcon = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size} strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg>
);
export const AlertIcon = ({ size = 20 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
);
export const WarnIcon = ({ size = 20 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17v.5" /></svg>
);
export const UploadIcon = ({ size = 26 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" /></svg>
);
export const MailIcon = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size} strokeLinejoin="round"><path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" /></svg>
);
export const CloseIcon = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const SendIcon = ({ size = 20 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const MoonIcon = ({ size = 20 }: P) => (
  <svg {...base} width={size} height={size} strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
);
export const SunIcon = ({ size = 20 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const BulbIcon = ({ size = 18 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></svg>
);
export const InfoIcon = ({ size = 18 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
);
export const CheckIcon = ({ size = 18 }: P) => (
  <svg {...base} width={size} height={size} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>
);

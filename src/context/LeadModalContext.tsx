import { createContext, useContext, useState, type ReactNode } from "react";

export type LeadModalSource = "header" | "calculator";

interface LeadModalContextType {
  open: boolean;
  source: LeadModalSource;
  brief: Record<string, unknown> | null;
  openModal: (source?: LeadModalSource, brief?: Record<string, unknown>) => void;
  closeModal: () => void;
}

const LeadModalContext = createContext<LeadModalContextType>({
  open: false,
  source: "header",
  brief: null,
  openModal: () => {},
  closeModal: () => {},
});

export const useLeadModal = () => useContext(LeadModalContext);

export const LeadModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<LeadModalSource>("header");
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);

  const openModal = (src: LeadModalSource = "header", briefData?: Record<string, unknown>) => {
    setSource(src);
    setBrief(briefData ?? null);
    setOpen(true);
  };

  return (
    <LeadModalContext.Provider value={{ open, source, brief, openModal, closeModal: () => setOpen(false) }}>
      {children}
    </LeadModalContext.Provider>
  );
};

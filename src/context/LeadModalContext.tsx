import { createContext, useContext, useState, type ReactNode } from "react";

interface LeadModalContextType {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const LeadModalContext = createContext<LeadModalContextType>({
  open: false,
  openModal: () => {},
  closeModal: () => {},
});

export const useLeadModal = () => useContext(LeadModalContext);

export const LeadModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <LeadModalContext.Provider value={{ open, openModal: () => setOpen(true), closeModal: () => setOpen(false) }}>
      {children}
    </LeadModalContext.Provider>
  );
};

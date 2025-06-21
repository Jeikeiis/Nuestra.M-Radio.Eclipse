import { createContext } from "react";

export const HydrationContext = createContext(false);
export const ThemeContext = createContext({
  darkMode: true,
  setDarkMode: (v: boolean) => {},
});
export const RadioDashboardContext = createContext<{
  radioOpen: boolean;
  setRadioOpen: (v: boolean) => void;
}>({
  radioOpen: false,
  setRadioOpen: () => {},
});

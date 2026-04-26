import { createContext, useContext } from "react";

import { appThemes, type AppThemeColors, type AppThemeName } from "../theme";

const AppThemeContext = createContext({
  colors: appThemes.light as AppThemeColors,
  mode: "light" as AppThemeName,
});

export const AppThemeProvider = AppThemeContext.Provider;

export function useAppTheme() {
  return useContext(AppThemeContext);
}

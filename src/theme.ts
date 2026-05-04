 export const brandColors = {
  blue: "#16478e",
  red: "#ea1c2d",
  grey: "#bbbbbb",
  black: "#000000",
  white: "#ffffff",
} as const;

export const surfaceColors = {
  canvas: "#f5f7fb",
  surface: "#ffffff",
  border: "#e5e7eb",
  track: "#f1f5f9",
  ink: "#000000",
  subtleText: "#64748b",
  softText: "#f8fafc",
} as const;

export const toneColors = {
  orange: brandColors.red,
  orangeSurface: "rgba(234, 28, 45, 0.12)",
  orangeInk: "#991b1b",
  mintSurface: "rgba(22, 71, 142, 0.12)",
  mintInk: brandColors.blue,
  goldSurface: "rgba(187, 187, 187, 0.22)",
  goldInk: "#475569",
  navySurface: "rgba(22, 71, 142, 0.18)",
  navyInk: "#0d2e5c",
} as const;

export const colors = {
  ...brandColors,
  ...surfaceColors,
  ...toneColors,
};

export const darkColors = {
  ...colors,
  canvas: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  track: "#0f172a",
  ink: "#f8fafc",
  subtleText: "#e2e8f0",
  softText: "#0f172a",
  navySurface: "rgba(22, 71, 142, 0.34)",
  navyInk: "#bfdbfe",
  orangeSurface: "rgba(234, 28, 45, 0.18)",
  orangeInk: "#f87171",
  goldSurface: "rgba(187, 187, 187, 0.18)",
  goldInk: "#94a3b8",
  mintSurface: "rgba(22, 71, 142, 0.28)",
  mintInk: "#bfdbfe",
};

export const appThemes = {
  light: colors,
  dark: darkColors,
} as const;

export type AppThemeName = keyof typeof appThemes;
export type AppThemeColors = Record<keyof typeof colors, string>;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 40,
};

export const radii = {
  md: 14,
  lg: 20,
  xl: 28,
};

export const shadows = {
  card: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
};

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
  border: "#d6dde8",
  track: "#e5e9f2",
  ink: "#11213d",
  subtleText: "#5c677c",
  softText: "#eef3fb",
} as const;

export const toneColors = {
  orange: brandColors.red,
  orangeSurface: "rgba(234, 28, 45, 0.12)",
  orangeInk: "#b31222",
  mintSurface: "rgba(22, 71, 142, 0.12)",
  mintInk: brandColors.blue,
  goldSurface: "rgba(187, 187, 187, 0.22)",
  goldInk: "#435066",
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
  canvas: "#0b1220",
  surface: "#121a2b",
  border: "#283449",
  track: "#253149",
  ink: "#eef4ff",
  subtleText: "#aab6cc",
  softText: "#172033",
  navySurface: "rgba(86, 141, 230, 0.2)",
  navyInk: "#c9ddff",
  orangeSurface: "rgba(234, 28, 45, 0.18)",
  orangeInk: "#ff9aa5",
  goldSurface: "rgba(187, 187, 187, 0.16)",
  goldInk: "#d8deea",
  mintSurface: "rgba(86, 141, 230, 0.18)",
  mintInk: "#c9ddff",
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

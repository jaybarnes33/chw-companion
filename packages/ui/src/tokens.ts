/** Brand tokens from Stitch design system */
export const colors = {
  shea: "#F1ECDF",
  indigoInk: "#0b1127",
  clay: "#a0410f",
  clayBright: "#B5501F",
  ember: "#ba1a1a",
  emberAlert: "#B23A2E",
  savanna: "#2D6A4F",
  millet: "#E9C46A",
  white: "#ffffff",
  onSurfaceVariant: "#46464d",
  secondaryContainer: "#ff8852",
  onSecondaryContainer: "#6e2600",
  surface: "#faf8ff",
  outline: "#76767e",
  tertiaryFixed: "#e7e2d5",
} as const;

export const spacing = {
  stackGap: 12,
  gutter: 16,
  touchTargetMin: 56,
  marginMobile: 20,
  sectionGap: 32,
} as const;

export const fonts = {
  display: "IBMPlexSans_700Bold",
  headline: "IBMPlexSans_600SemiBold",
  body: "IBMPlexSans_400Regular",
  bodyBold: "IBMPlexSans_700Bold",
  utility: "IBMPlexMono_500Medium",
} as const;

export function riskColor(tier: "RED" | "YELLOW" | "GREEN"): string {
  switch (tier) {
    case "RED":
      return colors.ember;
    case "YELLOW":
      return colors.millet;
    case "GREEN":
      return colors.savanna;
  }
}

export function riskCanvas(tier: "RED" | "YELLOW" | "GREEN"): string {
  switch (tier) {
    case "RED":
      return colors.emberAlert;
    case "YELLOW":
      return "#c47a0a";
    case "GREEN":
      return colors.savanna;
  }
}

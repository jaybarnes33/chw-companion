import {
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

export const CHW_THEME: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: "#0b1127",
    background: "#f1ecdf",
    card: "#0b1127",
    text: "#0b1127",
    border: "#c7c6ce",
    notification: "#ba1a1a",
  },
};

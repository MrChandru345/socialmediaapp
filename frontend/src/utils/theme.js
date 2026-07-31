/**
 * Midnight Ember - Centralized Theme Tokens
 * Centralized theme configuration for React runtime reference.
 * Colors align with the high-contrast CSS variable tokens declared in styles.css.
 */
export const MidnightEmberTheme = {
  background: "#0B0D14",        // deep ink navy-black — app canvas
  surface: "#151824",           // cards, feed post backgrounds
  surfaceElevated: "#1E212F",   // modals, sheets, image placeholders
  accentPrimary: "#C8FF3D",     // electric lime — active states, primary CTA, active nav icon
  accentSecondary: "#FF4D6D",   // coral-pink — likes, notifications, live badges, unseen story rings
  textPrimary: "#F5F5F0",       // off-white, main text
  textSecondary: "#8B8D98",     // muted gray, timestamps/captions/inactive icons
  border: "#262938",            // dividers, card borders, inactive story rings
};

export const LightTheme = {
  background: "#fafafa",
  surface: "#ffffff",
  surfaceElevated: "#f5f5f5",
  accentPrimary: "#0095f6",
  accentSecondary: "#e1306c",
  textPrimary: "#000000",
  textSecondary: "#737373",
  border: "#dbdbdb",
};

export const getThemeTokens = (currentTheme) => {
  return currentTheme === "dark" ? MidnightEmberTheme : LightTheme;
};

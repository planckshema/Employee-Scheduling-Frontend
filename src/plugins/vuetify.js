import { createVuetify } from "vuetify";
import "@mdi/font/css/materialdesignicons.css";

export default createVuetify({
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#0b6e4f",
          secondary: "#08a045",
          accent: "#6bbf59",
          background: "#edf8f2",
          surface: "#fffefb",
          success: "#08a045",
          warning: "#6bbf59",
          error: "#c65a4a",
          info: "#21d375",
          teal: "#21d375",
          blue: "#0b6e4f",
          yellow: "#6bbf59",
          darkblue: "#073b3a",
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: "lg",
    },
    VCard: {
      elevation: 0,
      rounded: "xl",
    },
    VTextField: {
      color: "primary",
      density: "comfortable",
      hideDetails: "auto",
      variant: "outlined",
    },
    VTextarea: {
      color: "primary",
      density: "comfortable",
      hideDetails: "auto",
      variant: "outlined",
    },
    VSelect: {
      color: "primary",
      density: "comfortable",
      hideDetails: "auto",
      variant: "outlined",
    },
    VProgressCircular: {
      color: "primary",
    },
  },
  icons: {
    defaultSet: "mdi",
  },
});

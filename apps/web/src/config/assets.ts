export const ASSETS = {
  brand: {
    /*
     * These are the filenames currently committed in your branch.
     * They have a double ".png" extension, so keep the paths exactly
     * like this until you rename the physical files later.
     */
    logoPrimary: "/assets/brand/logo-primary.png.png",
    logoStacked: "/assets/brand/logo-stacked.png.png",
    logoIcon: "/assets/brand/logo-icon.png.png",

    favicon: "/assets/brand/favicon_io/favicon.ico",
    favicon16: "/assets/brand/favicon_io/favicon-16x16.png",
    favicon32: "/assets/brand/favicon_io/favicon-32x32.png",
    appleTouchIcon: "/assets/brand/favicon_io/apple-touch-icon.png",
  },

  hero: {
    female: {
      desktop: "/assets/hero/hero-student-female.png",
      mobile: "/assets/hero/hero-student-female-mobile.jpg",
    },
    male: {
      desktop: "/assets/hero/hero-student-male.png",
      mobile: "/assets/hero/hero-student-male-mobile.jpg",
    },
  },
} as const;

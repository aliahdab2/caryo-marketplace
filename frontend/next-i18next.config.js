module.exports = {
  i18n: {
    defaultLocale: "ar",
    locales: ["en", "ar"],
    fallbackLng: "ar",
    detection: {
      order: ["cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["cookie"],
    },
  },
};

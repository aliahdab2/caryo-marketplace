module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar"],
    fallbackLng: "en",
    detection: {
      order: ["cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["cookie"],
    },
  },
};

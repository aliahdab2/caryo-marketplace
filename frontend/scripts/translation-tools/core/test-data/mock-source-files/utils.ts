import i18n from 'i18next';

export const getTranslatedMessage = (key: string) => {
  return i18n.t(key);
};

export const commonMessages = {
  title: i18n.t('sample-common:title'),
  error: i18n.t('sample-common:error')
};

// Dynamic key usage
export const getDynamicTranslation = (namespace: string, key: string) => {
  return i18n.t(`${namespace}:${key}`);
};

import React from 'react';
import { useTranslation } from 'react-i18next';

export const Component1 = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('sample-common:title')}</h1>
      <p>{t('sample-common:description')}</p>
      <button>{t('sample-auth:login')}</button>
      <span>{t('sample-auth:signup')}</span>
      {/* This key doesn't exist in translations */}
      <div>{t('sample-common:nonExistentKey')}</div>
    </div>
  );
};

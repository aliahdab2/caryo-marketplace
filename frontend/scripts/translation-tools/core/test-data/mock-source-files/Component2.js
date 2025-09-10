import { useTranslation } from 'react-i18next';

const Component2 = () => {
  const { t } = useTranslation();
  
  const handleClick = () => {
    alert(t('sample-auth:password'));
  };
  
  return (
    <div>
      <p>{t('sample-common:welcome')}</p>
      <button onClick={handleClick}>{t('sample-auth:submit')}</button>
      {/* Using a key that exists but will be orphaned */}
      <span>{t('sample-duplicates:duplicateKey1')}</span>
    </div>
  );
};

export default Component2;

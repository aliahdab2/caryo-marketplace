// Report type definitions matching backend ReportType enum
export const REPORT_TYPES = {
  SPAM: {
    value: 'SPAM',
    labelEn: 'Spam',
    labelAr: 'رسائل مزعجة',
    descriptionEn: 'Unsolicited or repetitive messages',
    descriptionAr: 'رسائل غير مرغوب فيها أو متكررة'
  },
  HARASSMENT: {
    value: 'HARASSMENT',
    labelEn: 'Harassment',
    labelAr: 'مضايقة',
    descriptionEn: 'Abusive, threatening, or harassing behavior',
    descriptionAr: 'سلوك مسيء أو تهديد أو مضايقة'
  },
  SCAM: {
    value: 'SCAM',
    labelEn: 'Scam',
    labelAr: 'احتيال',
    descriptionEn: 'Fraudulent or deceptive behavior',
    descriptionAr: 'سلوك احتيالي أو خادع'
  },
  FRAUD: {
    value: 'FRAUD',
    labelEn: 'Fraud',
    labelAr: 'نصب',
    descriptionEn: 'Attempting to defraud or steal',
    descriptionAr: 'محاولة النصب أو السرقة'
  },
  INAPPROPRIATE_CONTENT: {
    value: 'INAPPROPRIATE_CONTENT',
    labelEn: 'Inappropriate Content',
    labelAr: 'محتوى غير لائق',
    descriptionEn: 'Offensive, explicit, or inappropriate content',
    descriptionAr: 'محتوى مسيء أو صريح أو غير لائق'
  },
  FAKE_LISTING: {
    value: 'FAKE_LISTING',
    labelEn: 'Fake Listing',
    labelAr: 'إعلان وهمي',
    descriptionEn: 'Fake or misleading listing information',
    descriptionAr: 'معلومات إعلان وهمية أو مضللة'
  },
  IMPERSONATION: {
    value: 'IMPERSONATION',
    labelEn: 'Impersonation',
    labelAr: 'انتحال شخصية',
    descriptionEn: 'User pretending to be someone else',
    descriptionAr: 'مستخدم ينتحل شخصية شخص آخر'
  },
  OTHER: {
    value: 'OTHER',
    labelEn: 'Other',
    labelAr: 'أخرى',
    descriptionEn: 'Other violations not covered above',
    descriptionAr: 'انتهاكات أخرى غير مذكورة أعلاه'
  }
} as const;

export type ReportTypeValue = typeof REPORT_TYPES[keyof typeof REPORT_TYPES]['value'];

export function getReportTypeLabel(value: string, locale: string = 'en'): string {
  const reportType = Object.values(REPORT_TYPES).find(rt => rt.value === value);
  if (!reportType) return value;
  return locale.startsWith('ar') ? reportType.labelAr : reportType.labelEn;
}

export function getReportTypeDescription(value: string, locale: string = 'en'): string {
  const reportType = Object.values(REPORT_TYPES).find(rt => rt.value === value);
  if (!reportType) return '';
  return locale.startsWith('ar') ? reportType.descriptionAr : reportType.descriptionEn;
}

export function getReportTypesArray(locale: string = 'en') {
  return Object.values(REPORT_TYPES).map(rt => ({
    value: rt.value,
    label: locale.startsWith('ar') ? rt.labelAr : rt.labelEn,
    description: locale.startsWith('ar') ? rt.descriptionAr : rt.descriptionEn
  }));
}


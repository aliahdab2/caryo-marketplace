'use client';

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, Camera } from 'lucide-react';

interface FileUploadProps {
  uploading: boolean;
  isRTL?: boolean;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUpload({
  uploading,
  isRTL = false,
  onImageSelect,
  onDocumentSelect
}: FileUploadProps) {
  const { t, i18n } = useTranslation('messages');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  // Use RTL from props or detect from language
  const rtl = isRTL || i18n.language === 'ar';

  return (
    <>
      {/* File Upload Buttons - RTL Aware */}
      <div className={`flex items-center gap-1 ${rtl ? 'flex-row-reverse' : ''}`}>
        {/* Camera button for images */}
        <button 
          onClick={() => imageInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200 group"
          title={t('attachImages')}
          aria-label={t('attachImages')}
          disabled={uploading}
        >
          <Camera className={`h-5 w-5 ${uploading ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
        </button>
        
        {/* Paperclip button for documents */}
        <button 
          onClick={() => documentInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all duration-200 group"
          title={t('attachDocuments')}
          aria-label={t('attachDocuments')}
          disabled={uploading}
        >
          <Paperclip className={`h-5 w-5 ${uploading ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform ${rtl ? 'scale-x-[-1]' : ''}`} />
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={onImageSelect}
        className="hidden"
        aria-label={t('selectImages')}
      />

      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf"
        onChange={onDocumentSelect}
        className="hidden"
        aria-label={t('selectDocuments')}
      />


    </>
  );
}

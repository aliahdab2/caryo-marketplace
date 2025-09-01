'use client';

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, Camera } from 'lucide-react';

interface FileUploadProps {
  uploading: boolean;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUpload({
  uploading,
  onImageSelect,
  onDocumentSelect
}: FileUploadProps) {
  const { t } = useTranslation('messages');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* File Upload Buttons - Blocket Style */}
      <div className="flex items-center gap-1">
        {/* Camera button for images */}
        <button 
          onClick={() => imageInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
          title="Add photos"
          aria-label="Add photos"
          disabled={uploading}
        >
          <Camera className="h-5 w-5" />
        </button>
        
        {/* Paperclip button for documents */}
        <button 
          onClick={() => documentInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
          title="Attach files"
          aria-label="Attach files"
          disabled={uploading}
        >
          <Paperclip className="h-5 w-5" />
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

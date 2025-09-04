'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X } from 'lucide-react';
import FileUpload from './FileUpload';

// Helper function for file size formatting
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Image Preview Component
interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  isRTL?: boolean;
}

function ImagePreview({ file, onRemove, isRTL = false }: ImagePreviewProps) {
  return (
    <div className="relative group">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all duration-200"
            title="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className={`mt-1 ${isRTL ? 'text-right' : 'text-center'}`}>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{file.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}

// Document Preview Component
interface DocumentPreviewProps {
  file: File;
  onRemove: () => void;
  isRTL?: boolean;
}

function DocumentPreview({ file, onRemove, isRTL = false }: DocumentPreviewProps) {
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return { icon: '📄', color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400', label: 'PDF' };
    } else if (file.type.includes('word')) {
      return { icon: '📝', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400', label: 'DOC' };
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return { icon: '📊', color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400', label: 'XLS' };
    } else if (file.type === 'text/plain') {
      return { icon: '📃', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', label: 'TXT' };
    } else {
      return { icon: '📎', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400', label: 'FILE' };
    }
  };

  const fileInfo = getFileIcon(file);

  return (
    <div className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`w-10 h-10 rounded-lg ${fileInfo.color} flex items-center justify-center flex-shrink-0`}>
        <span className="text-xs font-bold">{fileInfo.label}</span>
      </div>
      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors hover:scale-110 transform"
        title="Remove file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface MessageInputProps {
  newMessage: string;
  selectedFiles: File[];
  sending: boolean;
  uploading: boolean;
  isRTL: boolean;
  onMessageChange: (message: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onClearAllFiles: () => void;
}

export default function MessageInput({
  newMessage,
  selectedFiles,
  sending,
  uploading,
  isRTL,
  onMessageChange,
  onKeyPress,
  onSendMessage,
  onImageSelect,
  onDocumentSelect,
  onRemoveFile,
  onClearAllFiles
}: MessageInputProps) {
  const { t } = useTranslation('messages');

  const canSend = (!newMessage.trim() && selectedFiles.length === 0) || sending || uploading;
  const shouldShowSendButton = newMessage.trim() || selectedFiles.length > 0;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* File preview area - Enhanced visibility with RTL support */}
      {selectedFiles.length > 0 && (
        <div className={`px-4 pb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready to send
                </span>
              </div>
              <button
                onClick={onClearAllFiles}
                className="text-blue-500 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400 transition-colors hover:scale-110 transform"
                title={t('clearAllFiles')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Separate images and documents for better visibility */}
            <div className="space-y-3">
              {/* Images Section */}
              {selectedFiles.filter(file => file.type.startsWith('image/')).length > 0 && (
                <div>
                  <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      📷 {t('images')} ({selectedFiles.filter(file => file.type.startsWith('image/')).length})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedFiles
                      .map((file, index) => ({ file, index }))
                      .filter(({ file }) => file.type.startsWith('image/'))
                      .map(({ file, index }) => (
                        <ImagePreview
                          key={`${file.name}-${index}`}
                          file={file}
                          onRemove={() => onRemoveFile(index)}
                          isRTL={isRTL}
                        />
                      ))}
                  </div>
                </div>
              )}
              
              {/* Documents Section */}
              {selectedFiles.filter(file => !file.type.startsWith('image/')).length > 0 && (
                <div>
                  <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      📎 {t('documents')} ({selectedFiles.filter(file => !file.type.startsWith('image/')).length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedFiles
                      .map((file, index) => ({ file, index }))
                      .filter(({ file }) => !file.type.startsWith('image/'))
                      .map(({ file, index }) => (
                        <DocumentPreview
                          key={`${file.name}-${index}`}
                          file={file}
                          onRemove={() => onRemoveFile(index)}
                          isRTL={isRTL}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className={`flex items-end bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* File Upload Buttons */}
          <div className="flex items-end p-2">
            <FileUpload
              uploading={uploading}
              isRTL={isRTL}
              onImageSelect={onImageSelect}
              onDocumentSelect={onDocumentSelect}
            />
          </div>
          
          {/* Text Input */}
          <textarea
            placeholder={t('writeMessage')}
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={onKeyPress}
            rows={1}
            className="flex-1 p-3 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none resize-none text-sm max-h-20 overflow-y-auto overflow-x-hidden w-full"
            style={{ 
              minHeight: '44px', 
              wordWrap: 'break-word', 
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              maxWidth: '100%',
              width: '100%'
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          
          {/* Send Button */}
          {shouldShowSendButton && (
            <div className="flex items-end p-2">
              <button
                onClick={onSendMessage}
                disabled={canSend}
                className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex-shrink-0 group"
                title={sending || uploading ? t('sending') : t('sendMessage')}
              >
                {sending || uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className={`h-4 w-4 group-hover:scale-110 transition-transform ${isRTL ? 'scale-x-[-1]' : ''}`} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



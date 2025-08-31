import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface AccessibleMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

/**
 * Fully accessible message input component following WCAG 2.1 AA guidelines
 * Includes keyboard navigation, screen reader support, and proper ARIA labels
 */
export const AccessibleMessageInput: React.FC<AccessibleMessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  maxLength = 1000,
  allowAttachments = true,
  acceptedFileTypes = "image/*,.pdf,.doc,.docx,.txt",
  maxFileSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5
}) => {
  const { t } = useTranslation('messages');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSend = useCallback(() => {
    if ((!value.trim() && selectedFiles.length === 0) || disabled) return;
    
    onSend(value, selectedFiles);
    onChange('');
    setSelectedFiles([]);
  }, [value, selectedFiles, disabled, onSend, onChange]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB.`);
        return false;
      }
      return true;
    });
    
    if (selectedFiles.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles.length, maxFileSize, maxFiles]);
  
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Clean up object URLs
      const removedFile = prev[index];
      if (removedFile && removedFile.type.startsWith('image/')) {
        URL.revokeObjectURL(URL.createObjectURL(removedFile));
      }
      return newFiles;
    });
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    // Validate files directly instead of creating synthetic event
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB.`);
        return false;
      }
      return true;
    });
    
    if (selectedFiles.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [selectedFiles.length, maxFileSize, maxFiles]);
  
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;
  
  return (
    <div className="space-y-3">
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div 
          className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          role="region"
          aria-label={t('selectedFiles', { count: selectedFiles.length })}
        >
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group">
              {file.type.startsWith('image/') ? (
                <div className="relative">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    width={80}
                    height={60}
                    className="rounded-lg max-w-[80px] max-h-[60px] object-cover"
                    unoptimized
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label={t('removeFile', { fileName: file.name })}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                        {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    aria-label={t('removeFile', { fileName: file.name })}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Input Area */}
      <div 
        className={`flex items-end gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 ${
          dragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File Upload Button */}
        {allowAttachments && (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              className="sr-only"
              id="file-upload"
              aria-describedby="file-upload-description"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || selectedFiles.length >= maxFiles}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('attachFile')}
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <div id="file-upload-description" className="sr-only">
              {t('fileUploadDescription', { maxFiles, maxSize: maxFileSize / 1024 / 1024 })}
            </div>
          </div>
        )}
        
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('typeMessage')}
            disabled={disabled}
            maxLength={maxLength}
            rows={1}
            className="w-full p-0 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none resize-none text-sm"
            style={{ minHeight: '24px', maxHeight: '120px' }}
            aria-label={t('messageInput')}
            aria-describedby="character-count"
          />
          
          {/* Character Count */}
          {(isNearLimit || isOverLimit) && (
            <div 
              id="character-count"
              className={`absolute -bottom-5 right-0 text-xs ${
                isOverLimit ? 'text-red-500' : 'text-yellow-500'
              }`}
              aria-live="polite"
            >
              {characterCount}/{maxLength}
            </div>
          )}
        </div>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!value.trim() && selectedFiles.length === 0) || disabled || isOverLimit}
          className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('sendMessage')}
          type="button"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      
      {/* Drag and Drop Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              {t('dropFilesHere')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

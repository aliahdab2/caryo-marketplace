'use client';

import React, { useState, useRef } from 'react';

import { Check, CheckCheck, Download, Clock, Eye } from 'lucide-react';
import { MessageResponse } from '@/services/messaging';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import Image from 'next/image';
import CarMediaGallery from '@/components/CarMediaGallery';

interface AttachmentType {
  id: number;
  fileName: string;
  fileUrl: string;
  contentType?: string;
  size: number;
  image?: boolean;
  humanReadableSize?: string;
}

interface MessageBubbleProps {
  message: MessageResponse;
  isOwn: boolean;
  isRTL: boolean;
  onDownloadDocument: (fileKey: string, fileName: string) => void;
}

export default function MessageBubble({ message, isOwn, isRTL: _isRTL, onDownloadDocument }: MessageBubbleProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReadDetails, setShowReadDetails] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatReadTime = (dateString: string) => {
    const readDate = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - readDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return readDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getReadStatusIcon = () => {
    if (!isOwn) return null;
    
    if (message.isRead) {
      return (
        <div className="relative group">
          <CheckCheck className="h-3 w-3 text-green-400" />
          {message.readAt && (
            <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
              <div className="text-center">
                <div className="font-medium text-green-400">✓ Seen</div>
                <div className="text-gray-300">{formatReadTime(message.readAt)}</div>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="relative group">
          <Check className="h-3 w-3 text-blue-200" />
          <div className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
            <div className="text-blue-300">✓ Sent</div>
            {/* Tooltip arrow */}
            <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      );
    }
  };

  // Extract all images from attachments for gallery
  const imageAttachments = message.attachments?.filter(attachment => 
    attachment.image || attachment.contentType?.startsWith('image/')
  ) || [];

  const galleryMedia = imageAttachments.map(attachment => ({
    type: 'image' as const,
    url: transformMinioUrl(attachment.fileUrl),
    alt: attachment.fileName || 'Message attachment'
  }));

  const handleImageClick = (clickedAttachment: AttachmentType) => {
    const clickedIndex = imageAttachments.findIndex(att => att.id === clickedAttachment.id);
    setSelectedImageIndex(clickedIndex >= 0 ? clickedIndex : 0);
    
    // Trigger the CarMediaGallery modal by simulating a click on the gallery
    setTimeout(() => {
      if (galleryRef.current) {
        const clickableElement = galleryRef.current.querySelector('.cursor-pointer') as HTMLElement;
        if (clickableElement) {
          clickableElement.click();
        }
      }
    }, 100);
  };

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwn
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          >
            {/* Message Content */}
            {message.displayContent && message.displayContent.trim() && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.displayContent}
              </p>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`${message.displayContent && message.displayContent.trim() ? 'mt-2' : ''} space-y-2`}>
                {message.attachments.map((attachment, index) => (
                  <AttachmentDisplay
                    key={`${attachment.id}-${index}`}
                    attachment={attachment}
                    isOwn={isOwn}
                    onDownloadDocument={onDownloadDocument}
                    onImageClick={handleImageClick}
                  />
                ))}
              </div>
            )}

            {/* Message Time and Status */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} group`}>
              <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatTime(message.createdAt)}
              </span>
              {isOwn && (
                <div className="flex items-center relative">
                  {getReadStatusIcon()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CarMediaGallery with built-in modal - hidden but functional */}
      {galleryMedia.length > 0 && (
        <div 
          ref={galleryRef}
          className="fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0"
          style={{ zIndex: -1 }}
        >
          <CarMediaGallery
            media={galleryMedia}
            initialIndex={selectedImageIndex}
            key={`gallery-${selectedImageIndex}`} // Force re-render when index changes
          />
        </div>
      )}
    </>
  );
}

interface AttachmentDisplayProps {
  attachment: AttachmentType;
  isOwn: boolean;
  onDownloadDocument: (fileKey: string, fileName: string) => void;
  onImageClick?: (attachment: AttachmentType) => void;
}

function AttachmentDisplay({ attachment, isOwn, onDownloadDocument, onImageClick }: AttachmentDisplayProps) {
  const isImage = attachment.image || attachment.contentType?.startsWith('image/');

  if (isImage) {
    return (
      <div className="rounded-lg overflow-hidden">
        <Image
          src={transformMinioUrl(attachment.fileUrl)}
          alt={attachment.fileName}
          width={200}
          height={150}
          className="rounded-lg max-w-[200px] max-h-[150px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageClick ? onImageClick(attachment) : window.open(transformMinioUrl(attachment.fileUrl), '_blank')}
          unoptimized
          onError={(e) => {
            console.error('Failed to load image:', attachment.fileUrl);
            e.currentTarget.src = getDefaultImageUrl();
            e.currentTarget.onerror = null;
          }}
        />
      </div>
    );
  }

  // Document attachment
  return (
    <div 
      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      onClick={() => onDownloadDocument(attachment.fileUrl, attachment.fileName)}
      title={`Download ${attachment.fileName}`}
    >
      <div className="flex-shrink-0">
        <DocumentIcon contentType={attachment.contentType} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isOwn ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
          {attachment.fileName}
        </p>
        <p className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
          {attachment.humanReadableSize || `${(attachment.size / 1024 / 1024).toFixed(2)} MB`}
        </p>
      </div>
      <div className="flex-shrink-0">
        <Download className={`h-4 w-4 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`} />
      </div>
    </div>
  );
}

function DocumentIcon({ contentType }: { contentType?: string }) {
  if (contentType === 'application/pdf') {
    return (
      <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
        <span className="text-red-600 dark:text-red-400 text-xs font-medium">PDF</span>
      </div>
    );
  }
  
  if (contentType?.includes('word')) {
    return (
      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
        <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">DOC</span>
      </div>
    );
  }
  
  if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) {
    return (
      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
        <span className="text-green-600 dark:text-green-400 text-xs font-medium">XLS</span>
      </div>
    );
  }
  
  return (
    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
      <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">TXT</span>
    </div>
  );
}

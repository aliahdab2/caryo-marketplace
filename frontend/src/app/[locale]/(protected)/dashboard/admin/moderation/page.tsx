'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface MediaItem {
  id: number;
  fileKey: string;
  fileName: string;
  contentType: string;
  mediaType: string;
  listingId: number;
  moderationStatus: string;
  createdAt: string;
  moderatedAt?: string;
  moderatedByUsername?: string;
  moderationNotes?: string;
}

interface PageResponse {
  content: MediaItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function ImageModerationPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewImage, setPreviewImage] = useState<MediaItem | null>(null);

  // Fetch pending media
  const { data: mediaData, isLoading } = useQuery<PageResponse>({
    queryKey: ['admin-pending-media', page],
    queryFn: async () => {
      return api.get<PageResponse>(`/api/admin/media-moderation/pending?page=${page}&size=20`);
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<ModerationStats>({
    queryKey: ['admin-moderation-stats'],
    queryFn: async () => {
      return api.get<ModerationStats>('/api/admin/media-moderation/stats');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/admin/media-moderation/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-stats'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api.post(`/api/admin/media-moderation/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-stats'] });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (ids: number[]) => api.post('/api/admin/media-moderation/bulk-approve', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-stats'] });
      setSelectedIds([]);
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: number[]; reason?: string }) =>
      api.post('/api/admin/media-moderation/bulk-reject', { ids, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-stats'] });
      setSelectedIds([]);
    },
  });

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === (mediaData?.content?.length ?? 0)) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mediaData?.content?.map(m => m.id) ?? []);
    }
  }, [selectedIds, mediaData]);

  const handleSelectItem = useCallback((id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const getImageUrl = (fileKey: string) => {
    // Use the MinIO URL or your storage URL
    const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'caryo-assets';
    return `${minioUrl}/${bucket}/${fileKey}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('imageModeration', { ns: 'admin', defaultValue: 'Image Moderation' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('imageModerationDescription', { ns: 'admin', defaultValue: 'Review and approve uploaded images before they appear on the site' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats?.pending ?? 0}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            {t('pending', { ns: 'admin', defaultValue: 'Pending Review' })}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats?.approved ?? 0}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            {t('approved', { ns: 'admin', defaultValue: 'Approved' })}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats?.rejected ?? 0}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">
            {t('rejected', { ns: 'admin', defaultValue: 'Rejected' })}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-blue-700 dark:text-blue-300">
            {t('selectedCount', { ns: 'admin', count: selectedIds.length, defaultValue: '{{count}} items selected' })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => bulkApproveMutation.mutate(selectedIds)}
              disabled={bulkApproveMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {t('approveAll', { ns: 'admin', defaultValue: 'Approve All' })}
            </button>
            <button
              onClick={() => {
                const reason = window.prompt(t('rejectReason', { ns: 'admin', defaultValue: 'Enter rejection reason (optional):' }));
                bulkRejectMutation.mutate({ ids: selectedIds, reason: reason || undefined });
              }}
              disabled={bulkRejectMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {t('rejectAll', { ns: 'admin', defaultValue: 'Reject All' })}
            </button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t('loading', { ns: 'common', defaultValue: 'Loading...' })}</p>
        </div>
      ) : mediaData?.content?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('noImagesForReview', { ns: 'admin', defaultValue: 'No images pending review' })}
          </p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.length === (mediaData?.content?.length ?? 0) && mediaData?.content?.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('selectAll', { ns: 'common', defaultValue: 'Select All' })}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaData?.content?.map((media) => (
              <div
                key={media.id}
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 overflow-hidden transition-all ${
                  selectedIds.includes(media.id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(media.id)}
                    onChange={() => handleSelectItem(media.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 bg-white"
                  />
                </div>

                {/* Image */}
                <div
                  className="aspect-square relative cursor-pointer"
                  onClick={() => setPreviewImage(media)}
                >
                  <Image
                    src={getImageUrl(media.fileKey)}
                    alt={media.fileName || 'Uploaded image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                </div>

                {/* Info & Actions */}
                <div className="p-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                    {t('listingId', { ns: 'admin', defaultValue: 'Listing' })}: {media.listingId}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => approveMutation.mutate(media.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt(t('rejectReason', { ns: 'admin', defaultValue: 'Enter rejection reason (optional):' }));
                        rejectMutation.mutate({ id: media.id, reason: reason || undefined });
                      }}
                      disabled={rejectMutation.isPending}
                      className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(mediaData?.totalPages ?? 0) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                {t('previous', { ns: 'common', defaultValue: 'Previous' })}
              </button>
              <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                {page + 1} / {mediaData?.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min((mediaData?.totalPages ?? 1) - 1, p + 1))}
                disabled={page >= (mediaData?.totalPages ?? 1) - 1}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                {t('next', { ns: 'common', defaultValue: 'Next' })}
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-video">
              <Image
                src={getImageUrl(previewImage.fileKey)}
                alt={previewImage.fileName || 'Preview'}
                fill
                className="object-contain"
                sizes="80vw"
              />
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>{t('fileName', { ns: 'admin', defaultValue: 'File' })}: {previewImage.fileName}</div>
                <div>{t('listingId', { ns: 'admin', defaultValue: 'Listing' })}: {previewImage.listingId}</div>
                <div>{t('uploadedAt', { ns: 'admin', defaultValue: 'Uploaded' })}: {new Date(previewImage.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    approveMutation.mutate(previewImage.id);
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('approve', { ns: 'admin', defaultValue: 'Approve' })}
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt(t('rejectReason', { ns: 'admin', defaultValue: 'Enter rejection reason (optional):' }));
                    rejectMutation.mutate({ id: previewImage.id, reason: reason || undefined });
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t('reject', { ns: 'admin', defaultValue: 'Reject' })}
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  {t('close', { ns: 'common', defaultValue: 'Close' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

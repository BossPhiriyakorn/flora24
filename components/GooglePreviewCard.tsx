'use client';

import * as React from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_SITE_NAME = typeof process.env.NEXT_PUBLIC_SITE_NAME === 'string' && process.env.NEXT_PUBLIC_SITE_NAME
  ? process.env.NEXT_PUBLIC_SITE_NAME
  : 'Flora';
const DEFAULT_SITE_URL = typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : 'flora.co.th';
const SNIPPET_MAX_LENGTH = 160;

export interface GooglePreviewCardProps {
  title: string;
  snippet: string;
  date?: string;
  thumbnailUrl?: string | null;
  siteName?: string;
  siteUrl?: string;
  faviconUrl?: string;
  className?: string;
}

function formatPreviewDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateSnippet(text: string, maxLen: number): string {
  const t = (text || '').trim();
  if (!t) return '';
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim() + '…';
}

export function GooglePreviewCard({
  title,
  snippet,
  date,
  thumbnailUrl,
  siteName = DEFAULT_SITE_NAME,
  siteUrl = DEFAULT_SITE_URL,
  faviconUrl,
  className,
}: GooglePreviewCardProps) {
  const [viewMode, setViewMode] = React.useState<'mobile' | 'desktop'>('mobile');
  const displayDate = formatPreviewDate(date);
  const displaySnippet = truncateSnippet(snippet, SNIPPET_MAX_LENGTH);
  const hasThumbnail = !!thumbnailUrl;

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-slate-50/50 p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">Google preview</span>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              viewMode === 'mobile'
                ? 'bg-violet-600 text-white'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            )}
          >
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              viewMode === 'desktop'
                ? 'bg-violet-600 text-white'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            )}
          >
            Desktop
          </button>
        </div>
      </div>

      <div
        className={cn(
          'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
          viewMode === 'mobile' ? 'max-w-[380px]' : 'max-w-full'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {faviconUrl ? (
                <img src={faviconUrl} alt="" className="h-4 w-4 rounded-sm object-contain shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-sm bg-emerald-500 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">D</span>
                </div>
              )}
              <span className="font-medium text-slate-900 truncate">{siteName}</span>
              <MoreVertical className="w-4 h-4 text-slate-400 shrink-0 ml-auto" />
            </div>
            <p className="text-xs text-slate-500 mb-2">{siteUrl}</p>
            <h3 className={cn(
              'text-lg font-medium mb-1 line-clamp-2',
              title ? 'text-blue-800 hover:underline cursor-pointer' : 'text-slate-400 italic'
            )}>
              {title || 'ชื่อบทความจะแสดงเมื่อกรอกด้านบน'}
            </h3>
            <p className="text-sm text-slate-600">
              {displayDate}
              {displaySnippet ? ` - ${displaySnippet}` : ''}
            </p>
          </div>
          {hasThumbnail && (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-100">
              <img
                src={thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

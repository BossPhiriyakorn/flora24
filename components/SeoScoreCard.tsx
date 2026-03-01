'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeSeo, getScoreStatus, type SeoScoreInput, type SeoCheckItem } from '@/lib/seoScore';
import { cn } from '@/lib/utils';

interface SeoScoreCardProps {
  input: SeoScoreInput;
  className?: string;
}

const statusConfig = {
  good: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bullet: 'bg-emerald-500',
    sectionTitle: 'text-emerald-800',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bullet: 'bg-amber-500',
    sectionTitle: 'text-amber-800',
  },
  bad: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bullet: 'bg-red-500',
    sectionTitle: 'text-red-800',
  },
} as const;

const SECTION_LABELS = {
  bad: 'ปัญหาที่พบ',
  warning: 'จุดที่ควรปรับปรุง',
  good: 'ผลที่ดี',
} as const;

function SectionBlock({
  status,
  items,
  defaultOpen = true,
}: {
  status: 'bad' | 'warning' | 'good';
  items: SeoCheckItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const config = statusConfig[status];
  const count = items.length;
  if (count === 0) return null;

  return (
    <div className="border-b border-slate-100 last:border-b-0 last:pb-0 pb-3 last:mb-0 mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 py-2 text-left font-semibold text-sm rounded-lg hover:bg-slate-50/80 transition-colors',
          config.sectionTitle
        )}
      >
        <span>
          {SECTION_LABELS[status]} ({count})
        </span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && (
        <ul className="space-y-2 mt-1">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex items-start gap-2 text-sm',
                status === 'good' && 'text-slate-700',
                status === 'warning' && 'text-amber-800',
                status === 'bad' && 'text-red-800'
              )}
            >
              <span
                className={cn('w-2 h-2 rounded-full shrink-0 mt-2', config.bullet)}
                aria-hidden
              />
              <div className="min-w-0">
                <span className="font-medium">{item.label}: </span>
                <span className="text-slate-500">{item.message}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SeoScoreCard({ input, className }: SeoScoreCardProps) {
  const { score, checks } = React.useMemo(() => analyzeSeo(input), [input]);
  const status = getScoreStatus(score);
  const config = statusConfig[status];

  const problems = checks.filter((c) => c.status === 'bad');
  const improvements = checks.filter((c) => c.status === 'warning');
  const goodResults = checks.filter((c) => c.status === 'good');

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 bg-white',
        config.border,
        config.bg,
        className
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2',
            status === 'good' && 'bg-emerald-500 text-white border-emerald-600',
            status === 'warning' && 'bg-amber-500 text-white border-amber-600',
            status === 'bad' && 'bg-red-500 text-white border-red-600'
          )}
        >
          {score}
        </div>
        <div>
          <h4 className="font-bold text-slate-800">การวิเคราะห์ SEO</h4>
          <p className="text-sm text-slate-500">
            {status === 'good' && 'บทความนี้พร้อมสำหรับ SEO ดี'}
            {status === 'warning' && 'ควรปรับปรุงบางจุด'}
            {status === 'bad' && 'ควรเติมข้อมูลและปรับปรุงให้ครบ'}
          </p>
        </div>
      </div>

      <div className="text-sm font-semibold text-slate-700 mb-2">ผลการวิเคราะห์</div>
      <SectionBlock status="bad" items={problems} defaultOpen={problems.length > 0} />
      <SectionBlock status="warning" items={improvements} defaultOpen={improvements.length > 0} />
      <SectionBlock status="good" items={goodResults} defaultOpen={true} />
    </div>
  );
}

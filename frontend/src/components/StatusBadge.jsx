import React from 'react';

const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
    info: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export default function StatusBadge({ children, tone = 'neutral' }) {
    return <span className={`ui-status-badge ring-1 ring-inset ${tones[tone] || tones.neutral}`}>{children}</span>;
}

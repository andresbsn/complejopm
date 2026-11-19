import React from 'react';

export default function PageHeader({ title, description, actions, eyebrow }) {
    return (
        <div className="ui-page-header">
            <div className="min-w-0">
                {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-600">{eyebrow}</p>}
                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{actions}</div>}
        </div>
    );
}

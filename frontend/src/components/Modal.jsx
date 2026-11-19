import React, { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
    useEffect(() => {
        if (!open) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

    return (
        <div
            className="ui-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div className={`ui-modal ${sizes[size] || sizes.md}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="ui-modal-header">
                    <div className="min-w-0">
                        <h2 id="modal-title" className="truncate text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
                        {description && <p className="mt-1.5 text-[15px] leading-6 text-slate-500">{description}</p>}
                    </div>
                    <button type="button" aria-label="Cerrar" onClick={onClose} className="ui-icon-button">
                        <Icon name="close" size={19} />
                    </button>
                </div>
                <div className="ui-modal-body">{children}</div>
                {footer && <div className="ui-modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

import React from 'react';

const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
    building: <><path d="M3 21h18M5 21V5l7-2 7 2v16M9 21v-4h6v4M8 8h1M15 8h1M8 12h1M15 12h1" /></>,
    money: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M7 9h.01M17 15h.01" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /></>,
    tennis: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6c3.4 1.1 5.7 3.4 6.8 6.8 1.1 3.4 3.4 5.7 6.8 6.8M18.4 5.6c-3.4 1.1-5.7 3.4-6.8 6.8-1.1 3.4-3.4 5.7-6.8 6.8" /></>,
    football: <><path d="m12 3 3 2 3.5-.2 1.5 3.2-1.7 3 1.7 3-1.5 3.2L15 17l-3 2-3-2-3.5.2L4 14l1.7-3L4 8l1.5-3.2L9 5l3-2Z" /><path d="m12 8 2.4 1.7-.9 2.8h-3l-.9-2.8L12 8Z" /></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM12 13v4M8 21h8M9 17h6" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    cash: <><path d="M3 7h18v12H3z" /><path d="M7 7V5h14v12h-3M12 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.3a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 1.7 11H1.5a2 2 0 1 1 0-4h.2a2 2 0 0 0 1.4-3.4L3 3.5a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 9.3-.6V-.8a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.9 7h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.5 4Z" transform="translate(1 1) scale(.9)" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
    return (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {paths[name] || paths.dashboard}
        </svg>
    );
}

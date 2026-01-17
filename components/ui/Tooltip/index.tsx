'use client';

import { useState } from 'react';

export default function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);

    return (
        <span
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={{ position: 'relative', display: 'inline-block' }}
        >
      {children}
            {visible && (
                <span
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        // transform: 'translateX(-50%)',
                        background: '#333',
                        color: '#fff',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                        zIndex: 10,
                        pointerEvents: 'none',
                    }}
                >
          {text}
        </span>
            )}
    </span>
    );
}

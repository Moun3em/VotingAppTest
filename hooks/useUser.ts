'use client';

import { useState, useEffect } from 'react';

export function useUser() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        let stored = localStorage.getItem('topic-engine-user-id');
        if (!stored) {
            stored = crypto.randomUUID();
            localStorage.setItem('topic-engine-user-id', stored);
        }
        setUserId(stored);
    }, []);

    return userId;
}

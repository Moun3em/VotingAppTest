'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Clock } from 'lucide-react';
import styles from './TopicCard.module.css';

interface Topic {
    id: string;
    title: string;
    author_id: string; // pseudo username for now
    net_score: number;
    comment_count: number;
    created_at: string;
}

import { useUser } from '@/hooks/useUser';

export default function TopicCard({ topic }: { topic: Topic }) {
    const currentUserId = useUser();
    const [score, setScore] = useState(topic.net_score);
    const [vote, setVote] = useState<'UP' | 'DOWN' | null>(null); // track local user vote state
    // In a real app, we'd fetch the user's existing vote on mount or prop.

    const handleVote = async (type: 'VOTE_UP' | 'VOTE_DOWN') => {
        // Optimistic Update
        let delta = 0;
        if (type === 'VOTE_UP') {
            if (vote === 'UP') {
                setVote(null);
                delta = -1;
            } else if (vote === 'DOWN') {
                setVote('UP');
                delta = 2;
            } else {
                setVote('UP');
                delta = 1;
            }
        } else {
            if (vote === 'DOWN') {
                setVote(null);
                delta = 1;
            } else if (vote === 'UP') {
                setVote('DOWN');
                delta = -2;
            } else {
                setVote('DOWN');
                delta = -1;
            }
        }

        setScore(s => s + delta);

        // API Call
        try {
            await fetch('/api/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUserId,
                    target_id: topic.id,
                    target_type: 'TOPIC',
                    interaction_type: type
                })
            });
        } catch (err) {
            console.error('Vote failed', err);
            // Revert on failure (omitted for brevity)
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 36e5);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className={`glass-panel ${styles.card}`}>
            <div className={styles.voteColumn}>
                <button
                    className="icon-btn"
                    onClick={() => handleVote('VOTE_UP')}
                    style={{ color: vote === 'UP' ? 'var(--secondary)' : 'inherit' }}
                >
                    <ArrowBigUp />
                </button>
                <span className={styles.score} style={{ color: vote ? 'var(--secondary)' : 'inherit' }}>
                    {score}
                </span>
                <button
                    className="icon-btn"
                    onClick={() => handleVote('VOTE_DOWN')}
                    style={{ color: vote === 'DOWN' ? '#888' : 'inherit' }}
                >
                    <ArrowBigDown />
                </button>
            </div>

            <div className={styles.content}>
                <Link href={`/topics/${topic.id}`} className={styles.title}>
                    {topic.title}
                </Link>
                <div className={styles.meta}>
                    <span className={styles.metaItem}>
                        <Clock size={14} />
                        {timeAgo(topic.created_at)}
                    </span>
                    <span className={styles.metaItem}>
                        by {topic.author_id.slice(0, 6)}...
                    </span>
                    <Link href={`/topics/${topic.id}`} className={styles.metaItem}>
                        <MessageSquare size={14} />
                        {topic.comment_count} comments
                    </Link>
                </div>
            </div>
        </div>
    );
}

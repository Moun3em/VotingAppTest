'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import styles from './TopicCard.module.css'; // Reuse styles or create new

interface Comment {
    id: string;
    content: string;
    author_id: string;
    net_score: number;
    depth: number;
    parent_id: string | null;
    created_at: string;
}

interface ThreadProps {
    comments: Comment[];
    parentId: string | null;
    topicId: string;
    refresh: () => void;
}

export default function CommentThread({ comments, parentId, topicId, refresh }: ThreadProps) {
    const user = useUser();
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const filtered = comments.filter(c => c.parent_id === parentId);

    if (filtered.length === 0) return null;

    async function handleVote(commentId: string, type: 'VOTE_UP' | 'VOTE_DOWN') {
        if (!user) return;
        await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user,
                target_id: commentId,
                target_type: 'COMMENT',
                interaction_type: type
            })
        });
        refresh(); // Simple refresh for now
    }

    async function submitReply(parentId: string) {
        if (!user || !replyContent) return;
        await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic_id: topicId,
                author_id: user,
                content: replyContent,
                parent_id: parentId
            })
        });
        setReplyContent('');
        setReplyingTo(null);
        refresh();
    }

    return (
        <div className="pl-4 border-l border-white/10 mt-4">
            {filtered.map(comment => (
                <div key={comment.id} className="mb-4">
                    <div className="p-4 rounded bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2 flex justify-between">
                            <span>{comment.author_id.slice(0, 6)}...</span>
                            <span>{comment.net_score} points</span>
                        </div>
                        <p className="mb-3">{comment.content}</p>

                        <div className="flex gap-4 text-sm">
                            <button onClick={() => handleVote(comment.id, 'VOTE_UP')}>
                                <ArrowBigUp size={16} />
                            </button>
                            <button onClick={() => handleVote(comment.id, 'VOTE_DOWN')}>
                                <ArrowBigDown size={16} />
                            </button>
                            <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex gap-1 items-center">
                                <MessageSquare size={16} /> Reply
                            </button>
                        </div>
                    </div>

                    {replyingTo === comment.id && (
                        <div className="mt-2 pl-4">
                            <textarea
                                className="w-full bg-black/50 border border-white/20 p-2 rounded text-white"
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                autoFocus
                            />
                            <button className="btn btn-primary mt-2" onClick={() => submitReply(comment.id)}>Post Reply</button>
                        </div>
                    )}

                    {/* Recursive Render */}
                    <CommentThread
                        comments={comments}
                        parentId={comment.id}
                        topicId={topicId}
                        refresh={refresh}
                    />
                </div>
            ))}
        </div>
    );
}

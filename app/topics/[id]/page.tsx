'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import TopicCard from '@/components/TopicCard';
import CommentThread from '@/components/CommentThread';
import { useUser } from '@/hooks/useUser';
import { useRealtime } from '@/hooks/useRealtime';

interface Topic {
    id: string;
    title: string;
    author_id: string;
    net_score: number;
    comment_count: number;
    created_at: string;
}

interface Comment {
    id: string;
    content: string;
    author_id: string;
    net_score: number;
    depth: number;
    parent_id: string | null;
    created_at: string;
}

export default function TopicPage() {
    const { id } = useParams() as { id: string };
    const user = useUser();
    const [topic, setTopic] = useState<Topic | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [sort, setSort] = useState('top');
    const [newComment, setNewComment] = useState('');

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            // Fetch Topic
            const res = await fetch('/api/topics');
            const topics = await res.json();
            const t = topics.find((t: any) => t.id === id);
            if (t) setTopic(t);

            // Fetch Comments
            const resC = await fetch(`/api/comments?topic_id=${id}&sort=${sort}`);
            const comms = await resC.json();
            setComments(comms);
        } catch (e) {
            console.error(e);
        }
    }, [id, sort]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Realtime listeners
    useRealtime('comments', `topic_id=eq.${id}`, (payload) => {
        fetchData();
    });

    useRealtime('topics', `id=eq.${id}`, (payload) => {
        if (payload.new) {
            setTopic(prev => ({ ...prev, ...payload.new }));
        }
    });

    async function postComment() {
        if (!newComment || !user) return;
        await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic_id: id,
                author_id: user,
                content: newComment,
                parent_id: null
            })
        });
        setNewComment('');
        fetchData();
    }

    if (!topic) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <a href="/" className="text-sm text-purple-400 hover:text-purple-300">← Back to Feed</a>
            </div>

            <TopicCard topic={topic} />

            <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Discussion</h2>
                    <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                        {['top', 'new', 'controversial'].map(s => (
                            <button
                                key={s}
                                onClick={() => setSort(s)}
                                className={`px-3 py-1 rounded-md text-sm capitalize ${sort === s ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8 flex gap-2">
                    <textarea
                        className="flex-1 bg-black/50 border border-white/20 p-3 rounded-lg text-white"
                        placeholder="What are your thoughts?"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                    />
                    <button className="btn btn-primary h-auto" onClick={postComment}>Post</button>
                </div>

                <CommentThread
                    comments={comments}
                    parentId={null}
                    topicId={id}
                    refresh={fetchData}
                />
            </div>
        </div>
    );
}

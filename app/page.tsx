'use client';

import { useEffect, useState } from 'react';
import TopicCard from '@/components/TopicCard';
import { useUser } from '@/hooks/useUser';

interface Topic {
  id: string;
  title: string;
  author_id: string;
  net_score: number;
  comment_count: number;
  created_at: string;
}

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const user = useUser();

  useEffect(() => {
    fetch('/api/topics')
      .then(res => res.json())
      .then(data => setTopics(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Topics
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            // Simple prompt for MVP creation
            const title = prompt('Topic Title:');
            if (title && user) {
              fetch('/api/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author_id: user })
              }).then(() => window.location.reload());
            }
          }}
        >
          New Topic
        </button>
      </header>

      <div className="flex flex-col gap-4">
        {topics.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load leaderboard'));
  }, []);

  if (error) return <CapabilityCard title="Leaderboard" description="Compare team point totals." error={error} />;
  if (entries === null) return <CapabilityCard title="Leaderboard" description="Compare team point totals." loading />;
  if (entries.length === 0) return <CapabilityCard title="Leaderboard" description="Compare team point totals." emptyText="No leaderboard rankings available." />;

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ol className="list-group list-group-numbered">
        {entries.map((entry, index) => (
          <li className="list-group-item" key={entry.teamName ?? index}>
            {entry.teamName} - {entry.totalPoints} points
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}

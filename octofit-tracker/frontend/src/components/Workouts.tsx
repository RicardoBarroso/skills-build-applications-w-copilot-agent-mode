import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load workout suggestions'));
  }, []);

  if (error) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." error={error} />;
  if (suggestions === null) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading />;
  if (suggestions.length === 0) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." emptyText="No workout suggestions available." />;

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <ul className="list-group">
        {suggestions.map((suggestion, index) => (
          <li className="list-group-item" key={suggestion.title ?? index}>
            {suggestion.title}
            {suggestion.reason ? ` - ${suggestion.reason}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

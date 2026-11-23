import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  _id: string;
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load activities');
      });
  }, []);

  if (error) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." error={error} />;
  }
  if (activities === null) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." loading />;
  }
  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points." emptyText="No activities available." />;
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ul className="list-group">
        {activities.map((activity) => (
          <li className="list-group-item" key={activity._id}>
            {activity.type} - {activity.minutes} minutes - {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

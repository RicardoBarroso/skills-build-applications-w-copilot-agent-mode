import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load teams'));
  }, []);

  if (error) return <CapabilityCard title="Teams" description="Manage teams and members." error={error} />;
  if (teams === null) return <CapabilityCard title="Teams" description="Manage teams and members." loading />;
  if (teams.length === 0) return <CapabilityCard title="Teams" description="Manage teams and members." emptyText="No teams available." />;

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ul className="list-group">
        {teams.map((team, index) => (
          <li className="list-group-item" key={team.name ?? index}>
            {team.name}
            {team.members?.length ? ` - ${team.members.length} members` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}

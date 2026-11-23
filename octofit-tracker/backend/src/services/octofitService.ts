import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || typeof minutes !== 'number'
    || !Types.ObjectId.isValid(userId)
    || !Types.ObjectId.isValid(teamId)
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity references a missing user or team'), { status: 400 });
  }

  try {
    return await Activity.create({
      user: userId,
      team: teamId,
      type,
      minutes,
      points: minutes,
      occurredAt: new Date(),
    });
  } catch (error) {
    throw Object.assign(
      error instanceof Error ? error : new Error('Invalid activity input'),
      { status: 400 },
    );
  }
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members = [] } = _input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };
  if (typeof name !== 'string' || name.trim() === '' || typeof mascot !== 'string' || mascot.trim() === '') {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Invalid team member references'), { status: 400 });
  }

  const memberIds = [...new Set(members as string[])];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id team').lean();
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('Team references a missing user'), { status: 400 });
  }

  try {
    const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
    for (const member of existingMembers) {
      if (member.team) {
        await Team.updateOne({ _id: member.team }, { $pull: { members: member._id } });
      }
      await User.updateOne({ _id: member._id }, { $set: { team: team._id } });
    }
    return team;
  } catch (error) {
    throw Object.assign(
      error instanceof Error ? error : new Error('Invalid team input'),
      { status: 400 },
    );
  }
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $project: {
        _id: 0,
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();

  let focus = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.toLowerCase() : '';
  let reason = `Matches your ${focus} fitness goal`;
  if (recentActivity?.type) {
    if (recentActivity.type === 'run' || recentActivity.type === 'cycle' || recentActivity.type === 'walk') {
      focus = 'endurance';
      reason = `Based on your recent ${recentActivity.type} activity`;
    } else if (recentActivity.type === 'strength') {
      focus = 'strength';
      reason = 'Based on your recent strength activity';
    }
  }

  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };

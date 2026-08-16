import {
  listQuests,
  listPlayers,
  isQuestClaimed,
  distinctDaysUntil,
  addPlayer,
  updatePlayer,
} from "./data";
import type { GardenState } from "./plant";
import { todayStr } from "./plant";

export type QuestProgress = {
  id: number;
  key: string;
  title: string;
  description: string;
  emoji: string;
  kind: string;
  goal: number;
  reward_xp: number;
  current: number;
  done: boolean;
  claimed: boolean;
  claimable: boolean;
};

// Compute how far the player is on each quest, given current garden state.
export async function computeQuestProgress(
  garden: GardenState
): Promise<QuestProgress[]> {
  const quests = await listQuests();
  const totalDays = await distinctDaysUntil(todayStr());
  const today = todayStr();

  const result: QuestProgress[] = [];
  for (const q of quests) {
    let current = 0;
    switch (q.key) {
      case "first_habit":
        current = garden.totalHabits;
        break;
      case "three_day":
        current = garden.doneToday;
        break;
      case "streak_3":
      case "streak_7":
        current = garden.streak;
        break;
      case "xp_100":
      case "xp_300":
        current = garden.xp;
        break;
      case "calendar_5":
        current = totalDays;
        break;
      default:
        current = 0;
    }
    const done = current >= q.goal;
    const claimed = await isQuestClaimed(q.id, today);
    result.push({ ...q, current, done, claimed, claimable: done && !claimed });
  }
  return result;
}

export type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  bestStreak: number;
  isMe: boolean;
};

export type Leaderboard = {
  players: LeaderboardEntry[];
  myRank: number;
  myXp: number;
};

// Build the global board. The live (non-community) user is always present and
// their XP/streak is refreshed from the real garden state.
export async function buildLeaderboard(garden: GardenState): Promise<Leaderboard> {
  const players = await listPlayers();
  const me = players.find((p) => p.is_community === 0);

  let meId: number;
  if (me) {
    meId = me.id;
    await updatePlayer(meId, garden.xp, garden.streak, garden.bestStreak);
    me.xp = garden.xp;
    me.streak = garden.streak;
    me.best_streak = garden.bestStreak;
  } else {
    meId = await addPlayer("You", "🌱", garden.xp, garden.streak, garden.bestStreak);
    players.push({
      id: meId,
      display_name: "You",
      avatar: "🌱",
      xp: garden.xp,
      streak: garden.streak,
      best_streak: garden.bestStreak,
      is_community: 0,
    });
  }

  const sorted = [...players].sort((a, b) => b.xp - a.xp);
  const myRank = sorted.findIndex((p) => p.id === meId) + 1;

  return {
    players: sorted.map((p, i) => ({
      rank: i + 1,
      name: p.display_name,
      avatar: p.avatar,
      xp: p.xp,
      streak: p.streak,
      bestStreak: p.best_streak,
      isMe: p.id === meId,
    })),
    myRank,
    myXp: garden.xp,
  };
}
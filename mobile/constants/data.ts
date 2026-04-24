export type Activity = {
  id: number;
  title: string;
  category: string;
  emoji: string;
  date: string;
  location: string;
  slots: number;
  joined: number;
  total: number;
  host: string;
  hostAvatar: string;
  hostColor: string;
  color: string;
  tags: string[];
};

export type Person = {
  id: number;
  name: string;
  dist: string;
  interests: string[];
  match: number;
  avatar: string;
  color: string;
};

export type Message = {
  id: number;
  sender: string;
  avatar: string;
  color: string;
  preview: string;
  time: string;
  unread: number;
  activity: string;
};

export const ACTIVITIES: Activity[] = [
  {
    id: 1, title: 'Morning Run — Central Park', category: 'Running', emoji: '🏃',
    date: 'Sat, Apr 26 · 7:00 AM', location: 'Central Park, NY',
    slots: 3, joined: 5, total: 8, host: 'Maya R.', hostAvatar: 'MR', hostColor: '#8DC5A0',
    color: '#ADDABF', tags: ['Outdoors', 'Fitness'],
  },
  {
    id: 2, title: 'Brunch at Le Botaniste', category: 'Food', emoji: '🥗',
    date: 'Sun, Apr 27 · 11:00 AM', location: 'SoHo, New York',
    slots: 2, joined: 4, total: 6, host: 'Luca M.', hostAvatar: 'LM', hostColor: '#D4A870',
    color: '#F5E4A8', tags: ['Food', 'Social'],
  },
  {
    id: 3, title: 'Jazz Night @ Blue Note', category: 'Music', emoji: '🎷',
    date: 'Fri, May 2 · 8:00 PM', location: 'West Village, NY',
    slots: 5, joined: 3, total: 8, host: 'Sofia K.', hostAvatar: 'SK', hostColor: '#A895D4',
    color: '#C0B8E8', tags: ['Music', 'Nightlife'],
  },
  {
    id: 4, title: 'Rock Climbing — Brooklyn', category: 'Sports', emoji: '🧗',
    date: 'Sat, May 3 · 2:00 PM', location: 'Brooklyn Boulders',
    slots: 1, joined: 5, total: 6, host: 'Remi J.', hostAvatar: 'RJ', hostColor: '#D48C6A',
    color: '#EFCCB0', tags: ['Sports', 'Adventure'],
  },
  {
    id: 5, title: 'Photography Walk', category: 'Art', emoji: '📸',
    date: 'Sun, May 4 · 10:00 AM', location: 'DUMBO, Brooklyn',
    slots: 4, joined: 2, total: 6, host: 'Aisha T.', hostAvatar: 'AT', hostColor: '#7EA8C8',
    color: '#B5C8DC', tags: ['Art', 'Outdoors'],
  },
];

export const SUGGESTED_PEOPLE: Person[] = [
  { id: 1, name: 'Maya R.', dist: '0.4 mi', interests: ['Running', 'Hiking', 'Yoga'], match: 94, avatar: 'MR', color: '#8DC5A0' },
  { id: 2, name: 'Luca M.', dist: '0.8 mi', interests: ['Food', 'Travel', 'Jazz'],   match: 87, avatar: 'LM', color: '#D4A870' },
  { id: 3, name: 'Sofia K.', dist: '1.2 mi', interests: ['Music', 'Art', 'Cinema'],   match: 81, avatar: 'SK', color: '#A895D4' },
];

export const MESSAGES: Message[] = [
  { id: 1, sender: 'Maya R.',        avatar: 'MR',  color: '#8DC5A0', preview: 'See you at the park entrance!',            time: '9:42 AM',   unread: 2, activity: 'Morning Run' },
  { id: 2, sender: 'Jazz Night Group', avatar: '🎷', color: '#A895D4', preview: 'Luca: I got us a table near the stage',    time: 'Yesterday', unread: 5, activity: 'Jazz Night' },
  { id: 3, sender: 'Luca M.',        avatar: 'LM',  color: '#D4A870', preview: 'Are you joining the brunch on Sunday?',    time: 'Tue',       unread: 0, activity: 'Brunch' },
];

export const INTERESTS = [
  'Running', 'Cycling', 'Yoga', 'Hiking', 'Food', 'Coffee', 'Travel', 'Music',
  'Jazz', 'Rock', 'Art', 'Photography', 'Cinema', 'Dancing', 'Tennis', 'Swimming',
  'Basketball', 'Reading', 'Gaming', 'Meditation',
];

export const AVATAR_COLORS: Record<string, string> = {
  MR: '#8DC5A0',
  LM: '#D4A870',
  SK: '#A895D4',
  RJ: '#D48C6A',
  AT: '#7EA8C8',
  DS: '#D490B2',
  PK: '#7ACAC8',
};

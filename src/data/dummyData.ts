/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  exp: number;
  maxExp: number;
  badges: Badge[];
}

export interface Game {
  id: string;
  title: string;
  category: string;
  rating: number;
  thumbnail: string;
  isFeatured?: boolean;
  isGame?: boolean;
}

export const dummyUser: UserProfile = {
  name: "Rizky Nurdiansyah",
  avatar: "https://picsum.photos/seed/gamer/200/200",
  level: 5,
  exp: 450,
  maxExp: 1000,
  badges: [
    { id: "1", name: "Kemenangan Pertama", icon: "Sword", color: "text-red-500" },
    { id: "2", name: "Pemburu Pagi", icon: "Clock", color: "text-yellow-500" },
    { id: "3", name: "Skor Tertinggi", icon: "Trophy", color: "text-blue-500" },
    { id: "4", name: "Sosialita", icon: "Users", color: "text-green-500" },
  ],
};

export const dummyGames: Game[] = [
  {
    id: "ngolab-catch",
    title: "Ngolab Catch: Arcade Rush",
    category: "Arcade",
    rating: 4.9,
    thumbnail: "/thumbnails/catch_thumbnail.png",
    isFeatured: true,
    isGame: true,
  },
  {
    id: "ngolab-memory",
    title: "Ngolab Memory Match",
    category: "Puzzle",
    rating: 4.8,
    thumbnail: "/thumbnails/memory_thumbnail.png",
    isFeatured: true,
    isGame: true,
  },
  {
    id: "ngolab-burger",
    title: "Ngolab Burger Builder",
    category: "Arcade",
    rating: 5.0,
    thumbnail: "/thumbnails/burger_thumbnail.png",
    isFeatured: true,
    isGame: true,
  },
  {
    id: "ngolab-doodle-road",
    title: "Ngolab Doodle Road",
    category: "Physics Puzzle",
    rating: 5.0,
    thumbnail: "/thumbnails/doodle_road_thumbnail.png",
    isFeatured: true,
    isGame: true,
  },
  {
    id: "ngolab-fitness-quiz",
    title: "Ngolab Fitness Quiz",
    category: "Trivia",
    rating: 4.9,
    thumbnail: "/thumbnails/fitness_thumbnail.png",
    isFeatured: true,
    isGame: true,
  },
  {
    id: "ngolab-astro-drift",
    title: "Ngolab Astro Drift",
    category: "Space",
    rating: 4.8,
    thumbnail: "/thumbnails/astro_drift_thumbnail.png",
    isFeatured: false,
    isGame: true,
  },
  {
    id: "ngolab-beat-bounce",
    title: "Ngolab Beat Bounce",
    category: "Rhythm",
    rating: 4.9,
    thumbnail: "/thumbnails/beat_bounce_thumbnail.png",
    isFeatured: false,
    isGame: true,
  },
  {
    id: "ngolab-neon-merge",
    title: "Ngolab Neon Merge",
    category: "Puzzle",
    rating: 4.8,
    thumbnail: "/thumbnails/neon_merge_thumbnail.png",
    isFeatured: false,
    isGame: true,
  },
  {
    id: "ngolab-glow-trail",
    title: "Ngolab Glow Trail",
    category: "Memory",
    rating: 4.7,
    thumbnail: "/thumbnails/glow_trail_thumbnail.png",
    isFeatured: false,
    isGame: true,
  },
  {
    id: "ngolab-sky-swipe",
    title: "Ngolab Sky Swipe",
    category: "Casual",
    rating: 4.9,
    thumbnail: "/thumbnails/sky_swipe_thumbnail.png",
    isFeatured: false,
    isGame: true,
  },
  {
    id: "ngolab-neon-slither",
    title: "Ngolab Neon Slither",
    category: "Action",
    rating: 4.9,
    thumbnail: "/thumbnails/neon_slither_thumbnail.png",
    isFeatured: false,
    isGame: true,
  },
];

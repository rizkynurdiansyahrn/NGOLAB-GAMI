/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Voucher {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  image: string;
  category: "Food" | "Beverage" | "Merch";
}

export interface AppUser {
  id: string;
  name: string;
  points: number;
  level: number;
  exp: number;
  nextExp: number;
  avatar: string;
  streak: number;
}

export const mockUser: AppUser = {
  id: "NG-2024-001",
  name: "GAMI_PLAYER",
  points: 500,
  level: 12,
  exp: 450,
  nextExp: 1000,
  avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
  streak: 5,
};

export const vouchers: Voucher[] = [
  {
    id: "v1",
    category: "Beverage",
    title: "Kopi Kampus 50% Disc",
    description: "Nikmati diskon 50% untuk semua varian es kopi.",
    pointsCost: 500,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "v2",
    category: "Food",
    title: "Gratis Snack Bakar",
    description: "Tukarkan 800 poin untuk 1 porsi sosis bakar.",
    pointsCost: 800,
    image: "https://images.unsplash.com/photo-1541544741938-0af808b77e90?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "v3",
    category: "Beverage",
    title: "Buy 1 Get 1 Matcha",
    description: "Beli 1 Matcha Latte gratis 1 reguler.",
    pointsCost: 1000,
    image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "v4",
    category: "Food",
    title: "Bakso Jumbo Special",
    description: "Potongan harga Rp 10.000 untuk Bakso Jumbo.",
    pointsCost: 300,
    image: "https://images.unsplash.com/photo-1523905330026-6a7bd9efda33?auto=format&fit=crop&q=80&w=300",
  },
];

export const leaderboardData = [
  { rank: 1, name: "ARCADE_MASTER", points: 25400, avatar: "https://i.pravatar.cc/150?u=1" },
  { rank: 2, name: "NGOLAB_LEGEND", points: 22100, avatar: "https://i.pravatar.cc/150?u=2" },
  { rank: 3, name: "MIE_LOVER", points: 19850, avatar: "https://i.pravatar.cc/150?u=3" },
  { rank: 4, name: "BAKSO_WARRIOR", points: 18400, avatar: "https://i.pravatar.cc/150?u=4" },
  { rank: 5, name: "CYBER_STUDENT", points: 15200, avatar: "https://i.pravatar.cc/150?u=5" },
  { rank: 6, name: "PLAYER_ONE", points: 14100, avatar: "https://i.pravatar.cc/150?u=6" },
  { rank: 7, name: "CAMPUS_PRO", points: 12500, avatar: "https://i.pravatar.cc/150?u=7" },
  { rank: 8, name: "GAMI_NOOB", points: 9800, avatar: "https://i.pravatar.cc/150?u=8" },
  { rank: 9, name: "TAP_MASTER", points: 8700, avatar: "https://i.pravatar.cc/150?u=9" },
  { rank: 10, name: "FAST_HANDS", points: 7500, avatar: "https://i.pravatar.cc/150?u=10" },
];

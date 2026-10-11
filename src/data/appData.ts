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
  pointsAvailable?: boolean;
  gamesPlayed?: number;
  gamesThisWeek?: number;
  rank?: number;
  memberId?: string;
  email?: string;
  phone?: string;
  role?: string;
}

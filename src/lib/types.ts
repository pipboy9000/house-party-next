// src/types/index.ts

import { Timestamp } from "firebase/firestore";

export interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  lastAddedAt?: Timestamp;
  // add more fields later
}

export interface Station {
  createdAt: Timestamp;
  currentVideoIndex: number;
  hostId: string;
  isPlaying: boolean;
  stationId: string;
  videoTitle: string;
  videoId: string;
  // add more fields later
}

export interface Track {
  addedAt: Timestamp;
  addedBy: string;
  id: string;
  thumbnail: string;
  title: string;
  videoId: string;
}

export interface PlayerStatus {
  currentVideoIndex: number;
  isPlaying: boolean;
  videoTitle: string;
  videoId: string;
}
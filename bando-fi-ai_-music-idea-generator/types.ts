
export interface Track {
  name: string;
  instrument: string;
  description: string;
  color?: string;
}

export interface MusicComposition {
  bpm: number;
  genre: string;
  mood: string;
  tracks: Track[];
}

export enum Tab {
  Jam = 'jam',
  Tracks = 'tracks',
  FX = 'fx',
  Cover = 'cover',
}

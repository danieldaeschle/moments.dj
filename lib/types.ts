export type Profile = {
  id: string;
  email: string;
  display_name: string;
  emoji: string;
  created_at: string;
};

export type Moment = {
  id: string;
  author_id: string;
  title: string;
  text: string | null;
  image_path: string | null;
  moment_date: string;
  moment_time: string | null;
  song_title: string | null;
  song_artist: string | null;
  song_deezer_id: string | null;
  song_cover_url: string | null;
  song_spotify_url: string | null;
  created_at: string;
};

export type Song = {
  title: string;
  artist: string;
  deezerId: string;
  coverUrl: string;
  deezerUrl: string;
  spotifyUrl: string | null;
};

export type MomentLike = {
  moment_id: string;
  user_id: string;
  created_at: string;
};

export type MomentWithAuthor = Moment & {
  profiles: Profile;
  moment_likes: MomentLike[];
};

export type TriggerType = "bad_day" | "date" | "manual";

export type Capsule = {
  id: string;
  author_id: string;
  recipient_id: string;
  title: string;
  message: string;
  image_path: string | null;
  trigger_type: TriggerType;
  open_at: string | null;
  opened_at: string | null;
  created_at: string;
};

export type CapsuleWithProfiles = Capsule & {
  author: Profile;
  recipient: Profile;
};

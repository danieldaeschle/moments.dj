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
  created_at: string;
};

export type MomentWithAuthor = Moment & {
  profiles: Profile;
};

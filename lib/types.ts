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
  created_at: string;
};

export type MomentWithAuthor = Moment & {
  profiles: Profile;
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

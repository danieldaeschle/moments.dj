import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

webPush.setVapidDetails(
  "mailto:hello@moments.dj",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const supabase = createAdminClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          message,
        )
        .catch(async (err) => {
          // Remove expired/invalid subscriptions
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }),
    ),
  );
}

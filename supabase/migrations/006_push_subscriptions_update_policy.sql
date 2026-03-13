-- Allow upsert by granting update on own push subscriptions
create policy "Users can update own subscriptions"
  on public.push_subscriptions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

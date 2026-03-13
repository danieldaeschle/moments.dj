-- Allow recipient to update opened_at on capsules sent to them
create policy "Recipient can update opened_at"
  on public.memory_capsules for update
  to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

-- Enable realtime for memory_capsules
alter publication supabase_realtime add table public.memory_capsules;

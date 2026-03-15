create policy "Author can delete unopened capsules"
  on public.memory_capsules for delete
  to authenticated
  using ((select auth.uid()) = author_id and opened_at is null);
-- Function to increment comment count atomically
create or replace function increment_comment_count(topic_id_param uuid)
returns void as $$
begin
  update public.topics
  set comment_count = comment_count + 1
  where id = topic_id_param;
end;
$$ language plpgsql security definer;

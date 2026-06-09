-- جدول حفظ FCM tokens
create table if not exists push_tokens (
  id serial primary key,
  user_id integer references users(id) on delete cascade,
  center_id integer references health_centers(id) on delete cascade,
  token text not null,
  platform text default 'web',
  created_at text,
  updated_at timestamptz default now()
);

-- السماح بالإضافة والقراءة
alter table push_tokens enable row level security;
create policy "allow all" on push_tokens for all using (true) with check (true);

-- منع تكرار نفس الـ token
create unique index if not exists push_tokens_token_idx on push_tokens(token);

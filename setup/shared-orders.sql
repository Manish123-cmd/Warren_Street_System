-- Run once in your Supabase project's SQL editor.
create table public.order_uploaders (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.order_uploaders enable row level security;
grant select on public.order_uploaders to authenticated;
create policy "Read own uploader permission" on public.order_uploaders for select to authenticated using (user_id = auth.uid());

create table public.order_documents (
 id uuid primary key default gen_random_uuid(),
 delivery_date date not null,
 file_name text not null check (length(file_name) between 1 and 255),
 object_path text unique not null,
 created_at timestamptz not null default now()
);
alter table public.order_documents enable row level security;
grant select on public.order_documents to anon, authenticated;
grant insert on public.order_documents to authenticated;
create policy "View order documents" on public.order_documents for select to anon, authenticated using (true);
create policy "Approved staff add documents" on public.order_documents for insert to authenticated with check (exists(select 1 from public.order_uploaders where user_id=auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('order-pdfs','order-pdfs',true,20971520,array['application/pdf']);
create policy "Approved staff upload PDFs" on storage.objects for insert to authenticated
with check (bucket_id='order-pdfs' and exists(select 1 from public.order_uploaders where user_id=auth.uid()));
create policy "Approved staff inspect PDFs" on storage.objects for select to authenticated
using (bucket_id='order-pdfs' and exists(select 1 from public.order_uploaders where user_id=auth.uid()));
create policy "Approved staff clean failed uploads" on storage.objects for delete to authenticated
using (bucket_id='order-pdfs' and exists(select 1 from public.order_uploaders where user_id=auth.uid()));

-- After creating a staff account in Authentication > Users, substitute its UUID:
-- insert into public.order_uploaders(user_id) values ('STAFF-USER-UUID');

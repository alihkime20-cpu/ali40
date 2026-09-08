insert into subjects(branch_id, name)
select id, 'عام' from branches
where is_active = true
on conflict (branch_id, name) do nothing;

insert into branches(name) values ('السادس العلمي'), ('السادس الأدبي') on conflict (name) do nothing;

insert into subjects(branch_id, name)
select b.id, s.name
from branches b
cross join (values
  ('السادس العلمي','الرياضيات'), ('السادس العلمي','الفيزياء'), ('السادس العلمي','الكيمياء'),
  ('السادس العلمي','الأحياء'), ('السادس العلمي','اللغة العربية'), ('السادس العلمي','اللغة الإنكليزية'),
  ('السادس العلمي','التربية الإسلامية'), ('السادس الأدبي','اللغة العربية'), ('السادس الأدبي','اللغة الإنكليزية'),
  ('السادس الأدبي','التربية الإسلامية'), ('السادس الأدبي','التاريخ'), ('السادس الأدبي','الجغرافية'),
  ('السادس الأدبي','الاقتصاد'), ('السادس الأدبي','الرياضيات')
) as s(branch_name, name) where b.name = s.branch_name
on conflict (branch_id, name) do nothing;

insert into academic_years(year) values (2023), (2024), (2025), (2026)
on conflict (year) do nothing;

insert into rounds(name) values ('الدور الأول'), ('الدور الثاني'), ('الدور الثالث')
on conflict (name) do nothing;

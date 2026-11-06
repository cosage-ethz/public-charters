-- Demo space with an excerpt of the Apertus Charter (Version 1.0, shortened,
-- articles 4, 8 and 10, the same text as the sample in index.html).
-- Run after schema.sql. Then make yourself admin (see docs/SETUP.md).

with sp as (
  insert into public.space (slug, name, access, created_by, settings)
  values ('apertus-demo', 'Apertus Charter (demo)', 'invite', null,
          '{"panel_size": 8, "points_budget": 100, "quotas": {}}'::jsonb)
  returning id
), v as (
  insert into public.charter_version (space_id, label, status, published_at)
  select id, 'Apertus Charter 1.0 (excerpt)', 'published', now() from sp
  returning id
)
insert into public.clause (charter_version_id, article, article_title, number, text, position)
select v.id, c.article, c.title, c.number, c.text, c.position
from v, (values
  (4,  'Preventing Harm', '4.1', 'The AI should actively protect against immediate threats to human wellbeing.', 1),
  (4,  'Preventing Harm', '4.2', 'Human safety must always take priority over abstract or theoretical considerations.', 2),
  (4,  'Preventing Harm', '4.3', 'Harmful requests must be refused, even if they sound legitimate.', 3),
  (8,  'Autonomy and Personal Boundaries', '8.1', 'The AI should uphold human autonomy by respecting individual and collective agency.', 4),
  (8,  'Autonomy and Personal Boundaries', '8.2', 'Personal information must be safeguarded by minimizing data collection and requiring explicit consent.', 5),
  (8,  'Autonomy and Personal Boundaries', '8.3', 'A clear line should be maintained between providing helpful assistance and exercising overreach.', 6),
  (10, 'Human Agency', '10.1', 'The AI must ensure that ultimate control and decision-making authority always remain with humans.', 7),
  (10, 'Human Agency', '10.2', 'The system should remain focused exclusively on serving intended human purposes, without developing, implying, or expressing separate interests, including any form of self-preservation or power-seeking.', 8),
  (10, 'Human Agency', '10.3', 'Responses should prevent unhealthy dependencies by supporting human independence in decision-making.', 9)
) as c(article, title, number, text, position);

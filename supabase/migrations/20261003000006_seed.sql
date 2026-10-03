-- =====================================================================
-- BOMBSHELL – početni podaci (idempotentno)
-- Trajanja su okvirna, a cene NISU unete (price_rsd = null → "Cena na upit").
-- Izmenite ih u admin panelu → Usluge.
-- NAPOMENA: recenzije se namerno NE seed-uju.
-- =====================================================================

-- Radno vreme: pon–sub 09–21, nedelja zatvoreno
insert into public.working_hours (day_of_week, open_time, close_time, is_closed) values
  (0, '09:00', '21:00', true),
  (1, '09:00', '21:00', false),
  (2, '09:00', '21:00', false),
  (3, '09:00', '21:00', false),
  (4, '09:00', '21:00', false),
  (5, '09:00', '21:00', false),
  (6, '09:00', '21:00', false)
on conflict (day_of_week) do nothing;

insert into public.service_categories (name, slug, icon, sort_order) values
  ('Ženski frizer',     'zenski-frizer',     'scissors',  1),
  ('Muški frizer',      'muski-frizer',      'scissors-men', 2),
  ('Manikir',           'manikir',           'hand',      3),
  ('Pedikir',           'pedikir',           'footprints', 4),
  ('Depilacija',        'depilacija',        'flame',     5),
  ('Šminka',            'sminka',            'brush',     6),
  ('Trajna šminka',     'trajna-sminka',     'pen-tool',  7),
  ('Svilene trepavice', 'svilene-trepavice', 'eye',       8),
  ('Masaže',            'masaze',            'flower',    9)
on conflict (slug) do nothing;

with data (slug, name, description, duration, sort) as (
  values
    ('zenski-frizer', 'Šišanje', 'Šišanje prilagođeno obliku lica i tipu kose, uz pranje i stilizovanje.', 45, 1),
    ('zenski-frizer', 'Feniranje', 'Glatko, voluminozno ili talasasto feniranje za svaki dan i posebne prilike.', 30, 2),
    ('zenski-frizer', 'Svečane frizure', 'Punđe, pletenice i elegantne frizure za venčanja, mature i proslave.', 60, 3),
    ('zenski-frizer', 'Farbanje', 'Bojenje kose kvalitetnim preparatima uz negu koja čuva sjaj i zdravlje kose.', 120, 4),
    ('zenski-frizer', 'Senčenje', 'Pramenovi i senčenje za prirodan, razigran efekat i dubinu boje.', 120, 5),
    ('zenski-frizer', 'Botox kose', 'Dubinski tretman koji obnavlja, zaglađuje i vraća sjaj oštećenoj kosi.', 90, 6),
    ('zenski-frizer', 'Ampule', 'Intenzivna nega ampulama za jačanje i hidrataciju kose.', 30, 7),
    ('muski-frizer', 'Muško šišanje', 'Klasično ili moderno muško šišanje uz precizno oblikovanje.', 45, 1),
    ('manikir', 'Gel lak', 'Dugotrajan gel lak sa sjajem koji traje i do tri nedelje.', 60, 1),
    ('manikir', 'Iscrtavanje', 'Nail art – ručno iscrtani detalji i ukrasi po Vašoj želji.', 60, 2),
    ('manikir', 'French manikir', 'Bezvremenski francuski manikir za elegantan i uredan izgled.', 60, 3),
    ('manikir', 'Nadogradnja noktiju', 'Nadogradnja gelom za željenu dužinu i oblik noktiju.', 90, 4),
    ('manikir', 'Izlivanje noktiju', 'Izlivanje gelom preko prirodnih noktiju za čvrstinu i lep oblik.', 90, 5),
    ('manikir', 'Spa manikir', 'Opuštajući tretman ruku: piling, maska, masaža i negovani nokti.', 60, 6),
    ('pedikir', 'Estetski pedikir', 'Nega stopala i noktiju za lepa, meka i negovana stopala.', 60, 1),
    ('depilacija', 'Depilacija toplim voskom', 'Efikasno uklanjanje dlačica toplim voskom, nežno prema koži.', 30, 1),
    ('depilacija', 'Depilacija hladnim voskom', 'Brza depilacija hladnim voskom za glatku kožu.', 30, 2),
    ('depilacija', 'Depilacija šećernom pastom', 'Prirodna depilacija šećernom pastom, pogodna za osetljivu kožu.', 30, 3),
    ('sminka', 'Profesionalna šminka', 'Dnevna, večernja ili svečana šminka koja ističe Vašu prirodnu lepotu.', 60, 1),
    ('trajna-sminka', 'Trajna šminka', 'Trajna šminka obrva, usana ili ajlajnera za lepotu bez svakodnevnog truda.', 120, 1),
    ('svilene-trepavice', 'Svilene trepavice', 'Ugradnja svilenih trepavica za prirodan ili dramatičan pogled.', 90, 1),
    ('masaze', 'Anticelulit masaža', 'Intenzivna masaža koja podstiče cirkulaciju i zateže kožu.', 60, 1),
    ('masaze', 'Relax masaža', 'Opuštajuća masaža celog tela za odmor uma i tela.', 60, 2),
    ('masaze', 'Terapeutska masaža', 'Ciljana masaža za oslobađanje napetosti u mišićima leđa i vrata.', 60, 3)
)
insert into public.services (category_id, name, description, duration_minutes, price_rsd, is_active, sort_order)
select c.id, d.name, d.description, d.duration, null, true, d.sort
from data d
join public.service_categories c on c.slug = d.slug
where not exists (
  select 1 from public.services s where s.category_id = c.id and s.name = d.name
);

-- ========================================================
-- EXPO INVESTMENT - SEED DATA
-- ========================================================

-- Insert Projects (UUIDs generated or static for testing)
INSERT INTO public.projects (id, name, description, team_name, category, logo_url, active)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'EcoTech',
    'Plataforma inteligente de reciclaje y valorización de residuos con incentivos tokenizados en campus universitarios.',
    'Equipo Verde Circular',
    'Sostenibilidad',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'RoboSmart',
    'Brazo robótico articulado modular y de bajo costo para automatización en laboratorios y centros de formación técnica.',
    'Mecatrónica Alpha',
    'Robótica & AI',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop&q=80',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'GreenApp',
    'Aplicación de carpooling y micromovilidad eléctrica coordinada para reducir la huella de carbono escolar y urbana.',
    'EcoMobility Lab',
    'Movilidad',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'SmartHome',
    'Ecosistema IoT para optimización del consumo eléctrico y detección predictiva de fugas de agua en viviendas.',
    'Domótica Conectada',
    'IoT & Hardware',
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'AgroVision',
    'Sistema de teledetección multiespectral con drones para identificación temprana de plagas y estrés hídrico en cultivos.',
    'AgroTech Innovators',
    'AgTech',
    'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&auto=format&fit=crop&q=80',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'BioHealth',
    'Dispositivo portátil no invasivo para monitoreo y telemetría de signos vitales en comunidades rurales aisladas.',
    'BioIngeniería Sanitaria',
    'Salud & Biotech',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
    true
  )
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  team_name = EXCLUDED.team_name,
  logo_url = EXCLUDED.logo_url;

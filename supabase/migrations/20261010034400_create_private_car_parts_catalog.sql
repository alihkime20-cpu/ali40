CREATE TABLE IF NOT EXISTS public.car_parts_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    part_number text,
    details text,
    image_path text NOT NULL UNIQUE,
    image_mime_type text NOT NULL DEFAULT 'image/jpeg'
        CHECK (image_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS car_parts_catalog_created_at_idx
    ON public.car_parts_catalog (created_at, id);

ALTER TABLE public.car_parts_catalog ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'car-part-catalog',
    'car-part-catalog',
    false,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

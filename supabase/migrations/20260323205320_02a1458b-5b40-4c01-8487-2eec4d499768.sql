ALTER TABLE public.races ADD COLUMN IF NOT EXISTS track_map_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('track-maps', 'track-maps', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read track maps" ON storage.objects
FOR SELECT USING (bucket_id = 'track-maps');

CREATE POLICY "Service role upload track maps" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'track-maps');

CREATE POLICY "Service role update track maps" ON storage.objects
FOR UPDATE USING (bucket_id = 'track-maps');
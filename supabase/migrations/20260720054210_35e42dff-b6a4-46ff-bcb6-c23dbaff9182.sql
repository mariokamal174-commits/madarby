
-- Add license_card_url column
ALTER TABLE public.coach_verifications
  ADD COLUMN IF NOT EXISTS license_card_url text;

-- Storage policies for coach-documents bucket
CREATE POLICY "coach_docs_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'coach-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "coach_docs_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'coach-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "coach_docs_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'coach-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "coach_docs_authenticated_read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'coach-documents');

CREATE TABLE IF NOT EXISTS public.draft_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, patient_id, kind)
);

ALTER TABLE public.draft_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drafts select" ON public.draft_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own drafts insert" ON public.draft_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own drafts update" ON public.draft_documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own drafts delete" ON public.draft_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER draft_documents_updated_at
  BEFORE UPDATE ON public.draft_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_draft_documents_user_patient ON public.draft_documents (user_id, patient_id, kind);
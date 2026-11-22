-- KC definition (#370): KCs are sized to what a Student masters as a whole.
-- The prompts changed, not the batch hashes, so the stored extractions go and
-- every map extracts again on its next Update map.

delete from public.unit_extractions;

update public.knowledge_map_builds set needs_update = true;

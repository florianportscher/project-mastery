-- The unique (course_id, position) keys of kcs, exercises and topics are
-- btree indexes that lead with course_id, so they already serve every lookup
-- by course_id. The plain course_id indexes beside them only cost writes.
drop index public.kcs_course_id_idx;
drop index public.exercises_course_id_idx;
drop index public.topics_course_id_idx;

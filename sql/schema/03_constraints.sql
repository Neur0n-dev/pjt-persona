-- =====================================================
-- 03_constraints.sql
-- FK 및 유니크 제약 조건 추가
-- =====================================================

-- t_persona_message: debates_uuid → t_persona_debates
ALTER TABLE t_persona_message
    ADD CONSTRAINT fk_message_debate
        FOREIGN KEY (debates_uuid)
        REFERENCES t_persona_debates (debates_uuid)
        ON DELETE CASCADE;

-- t_persona_votes: debates_uuid → t_persona_debates
ALTER TABLE t_persona_votes
    ADD CONSTRAINT fk_vote_debate
        FOREIGN KEY (debates_uuid)
        REFERENCES t_persona_debates (debates_uuid)
        ON DELETE CASCADE;

-- t_persona_votes: 동일 토론에서 같은 IP는 1표만 허용
ALTER TABLE t_persona_votes
    ADD CONSTRAINT unique_debate_voter
        UNIQUE (debates_uuid, votes_ip);

-- =====================================================
-- 02_indexes.sql
-- 성능 인덱스 생성
-- =====================================================

-- 토론별 메시지 순서 조회용 복합 인덱스
CREATE INDEX idx_debate_turn
    ON t_persona_message (debates_uuid, message_turn_number);

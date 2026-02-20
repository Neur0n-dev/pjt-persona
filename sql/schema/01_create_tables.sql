-- =====================================================
-- 01_create_tables.sql
-- 테이블 생성 (PK 포함, FK 및 인덱스 제외)
-- =====================================================

CREATE TABLE t_persona_debates (
    debates_uuid    VARCHAR(36)  NOT NULL,
    debates_topic   VARCHAR(500) NOT NULL,
    debates_status  VARCHAR(20)  NOT NULL DEFAULT 'ongoing',
    created_date    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (debates_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE t_persona_message (
    message_uuid        VARCHAR(36)  NOT NULL,
    debates_uuid        VARCHAR(36)  NOT NULL,
    message_persona     VARCHAR(50)  NOT NULL,
    message_content     TEXT         NOT NULL,
    message_turn_number INT          NOT NULL,
    created_date        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE t_persona_votes (
    votes_uuid    VARCHAR(36) NOT NULL,
    debates_uuid  VARCHAR(36) NOT NULL,
    votes_persona VARCHAR(50) NOT NULL,
    votes_ip      VARCHAR(50) NOT NULL,
    created_date  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (votes_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

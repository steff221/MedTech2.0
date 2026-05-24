-- Persistent notification store.
-- Notifications are created by domain events (appointment cancelled/completed, invites, etc.)
-- and surfaced to the owning user on their notifications page.

CREATE TABLE notifications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         VARCHAR(50)  NOT NULL,
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    read         BOOLEAN      NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

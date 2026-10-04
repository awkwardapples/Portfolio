-- The browser's timestamp for each submission, forwarded to Make.com as
-- client_timestamp (spec Q.3) when the cron retries a forward.
ALTER TABLE submissions ADD COLUMN client_timestamp TEXT;

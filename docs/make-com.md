# Make.com: the contact scenario

How messages from the contact form reach Josh (spec Q.2, Q.3; ADR-0043). The Worker stores each message in D1, then sends a copy to a Make.com webhook; the scenario checks the shared secret, adds a row to the Sheet and emails Josh. These steps are for Josh, in the Make.com and Google interfaces. Nothing here goes into the repository: the webhook address and the secret are typed straight into Cloudflare (`docs/deployment.md`).

## 1. A new webhook

Use a new webhook for the portfolio, not the SCB one.

1. In Make.com, **Create a new scenario**.
2. Add the first module: **Webhooks > Custom webhook > Add**. Name it "Portfolio contact".
3. Under **Advanced settings**, turn on **Get request headers**. The secret check in step 3 needs them.
4. Copy the webhook address Make.com shows. It goes into Cloudflare as the Worker secret `MAKE_WEBHOOK_URL` and nowhere else.

## 2. Teach it the data structure

1. Click **Redetermine data structure**; Make.com waits for a request.
2. Send one message through the site's contact form once the Worker has the webhook address (or ask Claude to send a test request from `wrangler dev`).
3. Make.com records the fields. Each message carries:

| Field                                              | Example                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `reference`                                        | `JL-7Q4MZ2KD` (quote this when replying)                        |
| `intent_label`                                     | `I'm hiring`                                                    |
| `wizard_id`                                        | `hiring`, `research`, `growtrades`, `music` or `other`          |
| `answers`                                          | every answer, keyed by field id (below)                         |
| `submission_id`                                    | the row number in D1                                            |
| `client_timestamp`                                 | when the visitor pressed Send                                   |
| `schema_version`, `quote_mode`, `pricing`, `media` | always `1`, `manual`, empty, empty (kept from the old contract) |

Answer fields: `contact_name`, `contact_email`, `organisation`, `message`, `anything_else`, `reply_window`, `data_processing_consent`, and per intent `work_type`, `arrangement`, `role_link` (hiring), `research_topic`, `which_work` (research), `growtrades_question` (GrowTrades), `music_topic` (music), `topic` (something else). A field the visitor did not fill is absent.

## 3. Reject anything without the secret

1. Choose a long random value for the secret (for example from a password manager). It goes into Cloudflare as `MAKE_WEBHOOK_SECRET` and into this filter, and nowhere else.
2. On the link after the webhook module, click the spanner, **Set up a filter**: name it "Shared secret", condition **Headers: X-Webhook-Secret**, **Equal to (case sensitive)**, the secret.
3. Requests without it stop here and are never written anywhere.

## 4. A Sheet for messages

1. In Google Sheets, create a spreadsheet named "Portfolio messages", shared with nobody else.
2. Add these column headings in row 1: Reference, Received, Intent, Name, Email, Organisation, Message, Anything else, Reply window, Details.
3. In the scenario, add **Google Sheets > Add a row** after the filter, and map: Reference to `reference`, Received to `client_timestamp`, Intent to `intent_label`, Name to `answers.contact_name`, Email to `answers.contact_email`, Organisation to `answers.organisation`, Message to `answers.message` (for "Something else" also map `answers.topic`), Anything else to `answers.anything_else`, Reply window to `answers.reply_window`, and Details to the intent's own answers (for example `work_type`, `arrangement` and `role_link` for hiring; a "Text aggregator" or `toString(answers)` works for all of them at once).

The Worker already neutralises spreadsheet formulas in the copy it sends (a leading `=`, `+`, `-` or `@` gets an apostrophe), so a message cannot run as a formula in the Sheet.

## 5. Email instead of WhatsApp

1. Remove the old WhatsApp module if you copied the SCB scenario.
2. Add **Email > Send an email** (or **Gmail > Send an email**), to your own address, with subject `New message: {{intent_label}} ({{reference}})` and a body listing the name, email, message and the Details column.
3. Set the reply-to address to `{{answers.contact_email}}`, so replying from your inbox goes to the visitor.

## 6. Turn it on

1. **Save**, then switch the scenario **On**, with scheduling "Immediately".
2. Send a test message from the live site. It should appear in the Sheet and your inbox within a minute, with the reference the success screen showed.

If Make.com is down or the scenario is off, nothing is lost: the Worker keeps the message in D1 and retries every 15 minutes for about four hours (ADR-0043). After that the row is marked `forward_failed`; `docs/data-protection.md` shows how to list those.

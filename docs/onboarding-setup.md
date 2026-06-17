# Staff onboarding — Supabase setup

The invite flow is: **Onboard staff** (admin) → branded email → invitee clicks
**Set your password** → lands on `/welcome` → sets a password that works on the
admin app **and** mobile.

For that to work end to end, configure these in the Supabase dashboard once.

## 1. Auth → URL Configuration

- **Site URL:** `https://admin.mathetes.live`
  (this is what `{{ .SiteURL }}` in the email resolves to)
- **Redirect URLs** (add both):
  - `https://admin.mathetes.live/**`
  - `http://localhost:3000/**` (for local dev)

## 2. Auth → Email Templates → "Invite user"

- **Subject:** `You're invited to the Mathetes team`
- **Message body:** paste `docs/invite-email-template.html`.

The CTA links to `/auth/confirm?token_hash=...&type=invite&next=/welcome`, which
uses token-hash verification (works for server-created invites — the old
code-exchange link did not, which is why invitees were bounced to sign-in).

## 3. Deliverability (stop landing in spam) — recommended

Supabase's built-in email sender is rate-limited and frequently flagged as spam.
For production, set **custom SMTP** with an authenticated domain:

- Auth → SMTP Settings → enable custom SMTP.
- Use a provider like Resend / Postmark / SendGrid.
- Verify the sending domain (SPF + DKIM, and ideally DMARC). Send as something
  like `no-reply@mathetes.live`.

Once the domain is authenticated, invites land in the inbox, not spam.

## 4. Env (Vercel)

- `NEXT_PUBLIC_ADMIN_URL=https://admin.mathetes.live`
- `SUPABASE_SERVICE_ROLE_KEY=...` (required to create invited users)

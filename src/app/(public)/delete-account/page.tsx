import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Delete Your Account · Mathetes",
  description:
    "How to request deletion of your Mathetes account and personal data.",
};

const LAST_UPDATED = "9 July 2026";
const CONTACT = "akinolajohnayomide@gmail.com";

export default function DeleteAccountPage() {
  return (
    <LegalLayout title="Delete Your Account and Data" lastUpdated={LAST_UPDATED}>
      <p>
        You can ask us to delete your Mathetes account and the personal data
        tied to it at any time. This page explains how to request it, what gets
        removed, and how long it takes. We have written it the way we would
        explain it to you in person.
      </p>

      <h2>How to request deletion</h2>
      <p>
        Email{" "}
        <a href={`mailto:${CONTACT}?subject=Delete my Mathetes account`}>
          {CONTACT}
        </a>{" "}
        from the email address on your Mathetes account, with the subject
        <strong> &ldquo;Delete my Mathetes account&rdquo;</strong>. So we can be
        sure the request is really you, please send it from the same email you
        signed up with (or tell us your full name and campus so we can verify).
      </p>
      <p>
        You do not need the app installed to make this request, and you do not
        need to pay anything. If you would rather ask in person, you can also
        speak to your parish pastor or house leader and they will pass the
        request to us.
      </p>

      <h2>What we delete</h2>
      <p>When we process your request, we permanently remove:</p>
      <ul>
        <li>Your sign-in account (email and password / linked Google account)</li>
        <li>
          Your profile: name, date of birth, gender, phone number, level,
          department, and profile photo
        </li>
        <li>Your direct messages and chat messages you have sent</li>
        <li>Your prayer requests and Ask-Pastor submissions</li>
        <li>
          Your personal library: notes, bookmarks, highlights, reading progress,
          and saved verse images
        </li>
        <li>Your house and chat memberships, streaks, and notifications</li>
      </ul>

      <h2>What we may keep for a short time</h2>
      <p>
        For safety and legal reasons we may keep a limited record for up to{" "}
        <strong>90 days</strong> before it too is removed:
      </p>
      <ul>
        <li>
          Basic safety and moderation records (for example, if a message was
          reported), so we can protect other members
        </li>
        <li>A minimal record that a deletion was requested and completed</li>
      </ul>
      <p>
        We also keep anonymous, aggregated statistics (for example, total
        sign-in counts) that can no longer be linked back to you.
      </p>

      <h2>How long it takes</h2>
      <p>
        We complete deletion requests within <strong>30 days</strong>. We will
        reply to confirm once it is done. After deletion you will no longer be
        able to sign in, and you would need to sign up again to use Mathetes.
      </p>

      <h2>Questions</h2>
      <p>
        Any questions about your data or this process? Email{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. See also our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </LegalLayout>
  );
}

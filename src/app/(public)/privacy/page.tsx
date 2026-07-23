import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · Mathetes",
  description:
    "How Mathetes collects, uses, and protects your information for CCCFSP FUOYE.",
};

const LAST_UPDATED = "16 June 2026";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        Mathetes is a discipleship companion for the Celestial Church of Christ
        Federal Students Parish (CCCFSP) at the Federal University Oye-Ekiti
        (FUOYE). This policy explains, in plain language, what we collect, why,
        and who can see it. We have tried to write it the way we would explain it
        to you in person, not in legal jargon.
      </p>

      <h2>Who we are</h2>
      <p>
        Mathetes is operated by <strong>John Ayomide Akinola</strong> on behalf
        of CCCFSP FUOYE. If you have any question about your data, you can reach
        us at{" "}
        <a href="mailto:akinolajohnayomide@gmail.com">
          akinolajohnayomide@gmail.com
        </a>
        .
      </p>

      <h2>What we collect</h2>
      <p>When you use Mathetes, we may collect:</p>
      <ul>
        <li>Your name</li>
        <li>Email address</li>
        <li>Gender</li>
        <li>Date of birth</li>
        <li>Phone number</li>
        <li>Your house fellowship and campus</li>
        <li>Profile photo (optional; you can use your initials instead)</li>
        <li>Chat messages you send</li>
        <li>Prayer requests you post</li>
        <li>Devotional engagement (what you read, your streaks)</li>
        <li>Reading plan reflections you write</li>
        <li>
          Circle teaching recordings, only where a Circle owner or admin visibly
          starts a recording in a live Circle meeting
        </li>
      </ul>

      <h2>What we do with it</h2>
      <p>We use your information only to run the ministry the app exists for:</p>
      <ul>
        <li>Deliver your daily Word, devotionals, and reading plans</li>
        <li>
          Connect you to your house fellowship, your discipler, and the parish
          community
        </li>
        <li>
          Enable pastoral care and oversight in line with the church&rsquo;s
          discipleship model (described below)
        </li>
      </ul>
      <p>
        We do not sell your data, and we do not use it for advertising. Ever.
      </p>

      <h2>Who sees what</h2>
      <p>
        Mathetes is a pastoral community, so some oversight is built in by
        design. We want you to know exactly how it works:
      </p>
      <ul>
        <li>
          <strong>The pastor</strong> sees parish-wide admin data: the content
          published, the members directory, Ask Pastor questions, and
          engagement at a glance.
        </li>
        <li>
          <strong>Your discipler</strong> sees your one-to-one discipler
          conversations, and <em>optionally</em> your reading plan reflections{" "}
          <strong>only if you explicitly choose to share them</strong>.
        </li>
        <li>
          <strong>Direct messages</strong> are seen only by the people in the
          conversation. A reported message may be reviewed by authorised parish
          leaders for safety; no one routinely reads private DMs.
        </li>
        <li>
          <strong>Reading plan reflections are private by default.</strong> What
          you write as you work through a plan is yours. No one sees it unless
          you deliberately share it with your discipler.
        </li>
      </ul>

      <h2>Circle meeting recordings</h2>
      <p>
        Circle meetings are never recorded automatically. If a Circle owner or
        admin starts recording a teaching, everyone in that meeting sees a clear
        recording notice and Circle members receive a notification. Finished
        recordings are private to that Circle and are available only while a
        member remains in it.
      </p>

      <h2>Where your data is stored</h2>
      <p>
        Your data is stored with Supabase, our database and authentication
        provider, on servers in the European Union. We chose an EU region for its
        strong data-protection standards. As a Nigerian ministry serving Nigerian
        students, we treat your information as sensitive personal data and handle
        it accordingly.
      </p>
      <p>
        Private Circle teaching recordings are stored in a private Cloudflare
        R2 bucket and delivered only through short-lived access links after
        Mathetes confirms Circle membership.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>
          <strong>While your account is active:</strong> we keep your data for as
          long as you use Mathetes.
        </li>
        <li>
          <strong>If you delete your account:</strong> we soft-delete your data
          immediately (it is hidden and no longer used) and permanently erase it
          after 30 days.
        </li>
        <li>
          <strong>One exception:</strong> records needed for safety and
          moderation (for example, a report of abuse) may be kept longer to
          protect the community.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>You are always in control of your information. You can:</p>
      <ul>
        <li>
          <strong>Delete your account</strong> at any time, which begins the
          30-day deletion described above.
        </li>
        <li>
          <strong>Request an export</strong> of your data in a readable format.
        </li>
      </ul>
      <p>
        To exercise either right, contact us at{" "}
        <a href="mailto:akinolajohnayomide@gmail.com">
          akinolajohnayomide@gmail.com
        </a>{" "}
        and we will respond promptly.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, concerns, or requests about your privacy? Email{" "}
        <a href="mailto:akinolajohnayomide@gmail.com">
          akinolajohnayomide@gmail.com
        </a>
        . A real person will reply.
      </p>
    </LegalLayout>
  );
}

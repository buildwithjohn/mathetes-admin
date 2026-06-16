import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service · Mathetes",
  description:
    "The terms and community covenant for using Mathetes at CCCFSP FUOYE.",
};

const LAST_UPDATED = "16 June 2026";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        Welcome to Mathetes, the discipleship companion for CCCFSP FUOYE. These
        terms describe how we walk together in this space. They are written
        plainly, in the spirit of a community covenant rather than a contract.
      </p>

      <h2>Acceptance of terms</h2>
      <p>
        By creating an account and using Mathetes, you agree to these terms and
        to our{" "}
        <a href="/privacy">Privacy Policy</a>. If you do not agree, please do not
        use the app.
      </p>

      <h2>Our community covenant</h2>
      <p>
        Mathetes is a discipleship space, not a social network. By joining, you
        step into a community where you can expect three things: loving{" "}
        <strong>oversight</strong> from your leaders, abundant{" "}
        <strong>grace</strong> when you stumble, and gentle{" "}
        <strong>accountability</strong> as you grow. We ask you to bring the same
        to others: honesty, kindness, and a desire to follow Jesus daily.
      </p>

      <h2>Acceptable use</h2>
      <p>To keep this a safe place for everyone, you agree not to:</p>
      <ul>
        <li>Harass, bully, threaten, or intimidate anyone</li>
        <li>Post sexual, obscene, or sexually suggestive content</li>
        <li>Promote hatred or contempt toward any person or group</li>
        <li>
          Share anyone&rsquo;s private information without their consent
          (doxxing)
        </li>
        <li>Engage in fraud, scams, or deception of any kind</li>
      </ul>
      <p>
        Content that crosses these lines may be removed, and may be reviewed by
        parish leadership.
      </p>

      <h2>Content ownership</h2>
      <ul>
        <li>
          <strong>What you write stays yours.</strong> Your messages, prayers,
          and posts belong to you. By posting, you grant the parish a limited
          licence to display that content for ministry purposes within Mathetes.
        </li>
        <li>
          <strong>Pastor-curated content</strong> (devotionals, Word of the Day,
          reading plans, announcements) remains the intellectual property of the
          parish.
        </li>
        <li>
          <strong>Reading plan reflections remain entirely yours</strong> and are
          never shared with anyone without your explicit consent.
        </li>
      </ul>

      <h2>Account termination</h2>
      <p>
        Parish leadership may suspend or remove an account for serious or
        repeated breaches of this covenant. If your account is removed and you
        believe it was a mistake, you may appeal directly to the pastor, who has
        the final say. You may also leave and delete your own account at any
        time.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Mathetes is a tool to support your walk with God and your fellowship; it
        is not a substitute for in-person pastoral care, professional counselling,
        or medical help. We provide the app &ldquo;as is&rdquo; and do our best to
        keep it running well, but we cannot promise it will be perfect or always
        available.
      </p>

      <h2>If you are in crisis</h2>
      <p>
        If you are struggling with your mental health or thinking of harming
        yourself, please reach out now. You are not alone.
      </p>
      <ul>
        <li>
          <strong>Mentally Aware Nigeria Initiative (MANI):</strong> 0809 111
          6264
        </li>
        <li>
          <strong>Nigeria Suicide Prevention Initiative:</strong> 0806 210 6493
          or 0809 210 6493
        </li>
        <li>
          <strong>Your pastor, Pastor Tunde Akinwale,</strong> through the Ask
          Pastor channel in the app, or via the parish leadership.
        </li>
      </ul>
      <p>
        In an immediate emergency, contact local emergency services or go to the
        nearest hospital.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria.
        Any dispute will be subject to the jurisdiction of the courts of Lagos.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. When we make a meaningful
        change, we will let you know through an in-app announcement. Continuing to
        use Mathetes after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:akinolajohnayomide@gmail.com">
          akinolajohnayomide@gmail.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}

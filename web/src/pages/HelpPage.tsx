import { Link } from 'react-router-dom';

export default function HelpPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-xl font-bold text-textPrimary">Help & Support</h1>
      <Link
        to="/faq"
        className="flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5"
      >
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary/10 text-2xl">❓</span>
        <div>
          <p className="font-bold text-textPrimary">Frequently Asked Questions</p>
          <p className="text-sm text-textSecondary">Find quick answers to common questions</p>
        </div>
        <span className="ml-auto text-textSecondary">›</span>
      </Link>
      <Link
        to="/contact"
        className="flex items-center gap-4 rounded-2xl bg-surface p-5 shadow-card transition-transform hover:-translate-y-0.5"
      >
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-secondary/10 text-2xl">🎧</span>
        <div>
          <p className="font-bold text-textPrimary">Contact Us</p>
          <p className="text-sm text-textSecondary">Send a message to our support team</p>
        </div>
        <span className="ml-auto text-textSecondary">›</span>
      </Link>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { submitContactForm } from '../api/contactApi';
import { useAuth } from '../context/AuthContext';

export default function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await submitContactForm({ name, email, subject, message });
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold text-textPrimary">Contact Us</h1>
      <p className="mb-6 text-sm text-textSecondary">Have a question? Send us a message and we'll get back to you shortly.</p>

      {sent && (
        <div className="mb-4 rounded-lg bg-success/10 p-4 text-sm text-success">
          We've received your inquiry and will get back to you shortly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-surface p-6 shadow-card">
        <input
          required
          aria-label="Your Name"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
        />
        <input
          required
          type="email"
          aria-label="Your Email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
        />
        <input
          required
          aria-label="Subject"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
        />
        <textarea
          required
          rows={5}
          aria-label="Your Message"
          placeholder="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-lg border border-border bg-page p-3.5 text-sm text-textPrimary outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

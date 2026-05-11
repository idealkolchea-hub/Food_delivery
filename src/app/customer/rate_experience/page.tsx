/**
 * C14 — Rate Experience
 * Route: /customer/rate-experience
 * FRD: UC-112 Post-Delivery Rating
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RATING_TAGS = [
  '🥇 Best taste', '⚡ Fast delivery', '🔥 Worth it', '📦 Great packaging',
  '👨‍🍳 Friendly partner', '🎯 Accurate order', '💜 Extra care', '🌟 Will order again',
];

export default function RateExperiencePage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    // In real app: POST to /api/ratings
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--sp-8) var(--sp-4)', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto var(--sp-5)',
          background: 'rgba(63,185,80,0.15)', border: '2px solid rgba(63,185,80,0.4)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '2.5rem' }}>🙏</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          Thanks for your feedback!
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', marginBottom: 'var(--sp-6)' }}>
          Your rating helps us improve BiteBlast for everyone
        </p>
        <Link href="/customer/home_logged" style={{
          display: 'block', padding: '14px',
          background: 'var(--amber)', color: '#0D1117',
          borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', fontWeight: 700,
          textDecoration: 'none',
        }}>
          Continue Browsing
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <Link href="/customer/home_logged" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textDecoration: 'none', marginBottom: 'var(--sp-3)' }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          How was your order?
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          Rate your experience to help us improve
        </p>
      </div>

      {/* Stars */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              style={{
                width: 56, height: 56, borderRadius: 'var(--r-lg)',
                background: rating >= star ? 'rgba(227,179,65,0.15)' : 'var(--bg-surface)',
                border: `2px solid ${rating >= star ? 'var(--amber)' : 'var(--border)'}`,
                fontSize: '1.8rem', cursor: 'pointer',
                transition: 'transform var(--t-fast), background var(--t-fast)',
                transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              ★
            </button>
          ))}
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          {rating === 0 ? 'Tap to rate' : rating <= 2 ? 'Could be better' : rating === 3 ? 'It was okay' : rating === 4 ? 'Pretty good!' : 'Amazing!'}
        </p>
      </div>

      {/* Tags */}
      {rating > 0 && (
        <div style={{ marginBottom: 'var(--sp-5)', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
            What did you like? (optional)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            {RATING_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '8px 14px',
                  background: selectedTags.has(tag) ? 'rgba(227,179,65,0.15)' : 'var(--bg-surface)',
                  border: `1px solid ${selectedTags.has(tag) ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-full)',
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  color: selectedTags.has(tag) ? 'var(--amber)' : 'var(--text-subtle)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  transition: 'all var(--t-fast)',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review text */}
      {rating > 0 && (
        <div style={{ marginBottom: 'var(--sp-5)', animation: 'fadeIn 0.3s ease-out' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
            Anything else? (optional)
          </h3>
          <textarea
            placeholder="Tell us more about your experience..."
            value={review}
            onChange={e => setReview(e.target.value)}
            maxLength={300}
            rows={3}
            style={{
              width: '100%', background: 'var(--bg-surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '12px 14px', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)', color: 'var(--text)',
              resize: 'none', outline: 'none',
              lineHeight: 1.6,
            }}
          />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
            {review.length}/300
          </p>
        </div>
      )}

      {/* Submit */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '16px var(--sp-4)',
        background: rating === 0 ? 'var(--bg-base)' : 'var(--amber)',
        color: rating === 0 ? 'var(--text-faint)' : '#0D1117',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontWeight: 700, fontSize: 'var(--text-sm)',
        zIndex: 50, cursor: rating === 0 ? 'not-allowed' : 'pointer',
        borderTop: rating === 0 ? '1px solid var(--border)' : 'none',
      }} onClick={rating === 0 ? undefined : handleSubmit}>
        {rating === 0 ? 'Select a rating' : `Submit ${rating}-star rating`}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
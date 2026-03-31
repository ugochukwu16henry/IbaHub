'use client';

import { useEffect, useState } from 'react';

type ReviewRow = {
  id: number;
  purchaseRequestId: number;
  rating: number;
  professionalism: number;
  honesty: number;
  quality: number;
  communication: number;
  timeliness: number;
  comment: string | null;
  adminStatus: string;
  createdAt: string;
};

export default function RetailReviewsPage() {
  const [mode, setMode] = useState<'owner' | 'buyer'>('buyer');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    fetch('/api/business-reviews', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setMode(data.mode || 'buyer');
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      });
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">
        {mode === 'owner' ? 'Buyer Ratings & Surveys' : 'My submitted reviews'}
      </h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="border rounded-md p-3 text-sm space-y-1">
            <p className="font-medium">
              Rating: {r.rating}/5 • Status: {r.adminStatus}
            </p>
            <p className="text-xs text-muted-foreground">
              Professionalism {r.professionalism}/5 • Honesty {r.honesty}/5 • Quality {r.quality}/5
            </p>
            <p className="text-xs text-muted-foreground">
              Communication {r.communication}/5 • Timeliness {r.timeliness}/5
            </p>
            {r.comment ? <p className="text-xs text-muted-foreground">Comment: {r.comment}</p> : null}
          </div>
        ))
      )}
    </section>
  );
}

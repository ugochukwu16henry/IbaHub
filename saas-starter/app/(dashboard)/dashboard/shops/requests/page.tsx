'use client';

import { useEffect, useState } from 'react';

type PurchaseRow = {
  id: number;
  status: string;
  quantity: number;
  itemId: number;
  teamId: number;
  totalAmountKobo: number;
};

function SurveyForm({
  purchaseRequestId,
  onSubmitted
}: {
  purchaseRequestId: number;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [honesty, setHonesty] = useState(5);
  const [quality, setQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState('');

  async function submit() {
    setMsg('');
    const res = await fetch('/api/business-reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        purchaseRequestId,
        rating,
        professionalism,
        honesty,
        quality,
        communication,
        timeliness,
        comment
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Failed to submit');
      return;
    }
    setMsg('Review submitted. Awaiting admin approval.');
    onSubmitted();
  }

  const Q = ({ label, value, set }: any) => (
    <label className="text-xs flex items-center gap-2">
      {label}
      <input type="range" min={1} max={5} value={value} onChange={(e) => set(Number(e.target.value))} />
      <span>{value}</span>
    </label>
  );

  return (
    <div className="border rounded-md p-3 space-y-2">
      <p className="font-medium text-sm">Quick survey about this business owner</p>
      <Q label="Overall rating" value={rating} set={setRating} />
      <Q label="Professionalism" value={professionalism} set={setProfessionalism} />
      <Q label="Honesty" value={honesty} set={setHonesty} />
      <Q label="Product quality" value={quality} set={setQuality} />
      <Q label="Communication" value={communication} set={setCommunication} />
      <Q label="Timeliness" value={timeliness} set={setTimeliness} />
      <textarea
        className="w-full rounded-md border border-input px-2 py-2 text-xs"
        placeholder="Comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button onClick={submit} className="rounded-md bg-orange-500 px-3 py-2 text-white text-xs">
        Submit survey
      </button>
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  );
}

export default function BuyerPurchaseRequestsPage() {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    const res = await fetch('/api/purchase-requests/mine', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not load purchase requests');
      return;
    }
    setRows(Array.isArray(data.requests) ? data.requests : []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl space-y-3">
      <h1 className="text-xl font-semibold">My purchase requests</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requests yet.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="border rounded-md p-3 space-y-2">
            <p className="text-sm font-medium">
              Request #{row.id} • Qty {row.quantity} • Status: {row.status}
            </p>
            {row.status === 'fulfilled' ? (
              <SurveyForm purchaseRequestId={row.id} onSubmitted={load} />
            ) : null}
          </div>
        ))
      )}
    </section>
  );
}

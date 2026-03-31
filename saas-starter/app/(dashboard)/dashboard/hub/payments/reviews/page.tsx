'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ReviewRow = {
  id: number;
  teamId: number;
  teamName?: string;
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

export default function AdminReviewModerationPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamIdFilter, setTeamIdFilter] = useState('');

  async function load() {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (teamIdFilter) params.set('teamId', teamIdFilter);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/admin/business-reviews${query}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load reviews');
      return;
    }
    setRows(Array.isArray(data.reviews) ? data.reviews : []);
  }

  async function moderate(id: number, adminStatus: 'approved' | 'rejected') {
    const res = await fetch(`/api/admin/business-reviews/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ adminStatus })
    });
    if (res.ok) load();
  }

  useEffect(() => {
    load();
  }, [statusFilter, teamIdFilter]);

  const exportQuery = new URLSearchParams({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(teamIdFilter ? { teamId: teamIdFilter } : {})
  }).toString();

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-5xl space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/dashboard/hub/payments">
          <ArrowLeft className="size-4 mr-1" />
          Hub payments
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium">Admin Review Moderation</h1>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Business Team ID</p>
          <input
            value={teamIdFilter}
            onChange={(e) => setTeamIdFilter(e.target.value)}
            placeholder="e.g. 12"
            className="rounded-md border px-2 py-1 text-sm w-32"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter('');
            setTeamIdFilter('');
          }}
        >
          Clear filters
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/admin/business-reviews/export${exportQuery ? `?${exportQuery}` : ''}`}>
            Export reviews CSV
          </a>
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.map((r) => (
        <div key={r.id} className="border rounded-md p-3 space-y-2 text-sm">
          <p className="font-medium">
            Team #{r.teamId} {r.teamName ? `(${r.teamName})` : ''} • Rating {r.rating}/5 • Status: {r.adminStatus}
          </p>
          <p className="text-xs text-muted-foreground">
            Professionalism {r.professionalism}/5 • Honesty {r.honesty}/5 • Quality {r.quality}/5 •
            Communication {r.communication}/5 • Timeliness {r.timeliness}/5
          </p>
          {r.comment ? <p className="text-xs text-muted-foreground">{r.comment}</p> : null}
          <div className="flex gap-2">
            <button
              onClick={() => moderate(r.id, 'approved')}
              className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
            >
              Approve testimonial
            </button>
            <button
              onClick={() => moderate(r.id, 'rejected')}
              className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

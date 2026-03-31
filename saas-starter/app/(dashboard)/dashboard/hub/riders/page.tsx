'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

type RiderItem = {
  id: number;
  userId: number;
  name: string | null;
  email: string;
  phone: string | null;
  vehicleType: string | null;
  serviceZone: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  availabilityStatus: 'offline' | 'available' | 'busy';
  createdAt: string;
};

type RidersResponse = {
  riders: RiderItem[];
  status: string;
  count: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RiderVerificationPage() {
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, mutate, isLoading } = useSWR<RidersResponse>(
    `/api/admin/riders?status=${status}`,
    fetcher
  );

  async function setVerification(rider: RiderItem, next: 'verified' | 'rejected') {
    setBusyId(rider.id);
    try {
      await fetch(`/api/admin/riders/${rider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: next })
      });
      await mutate();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          IbaHub command center
        </Link>
      </Button>

      <h1 className="text-lg lg:text-2xl font-medium mb-2">Rider verification</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Approve or reject rider onboarding requests. Verified riders can appear in{' '}
        <code className="bg-gray-100 px-1 rounded text-xs">GET /api/riders/available</code>.
      </p>

      <div className="flex gap-2 mb-5">
        <Button
          variant={status === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus('pending')}
        >
          Pending
        </Button>
        <Button
          variant={status === 'verified' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus('verified')}
        >
          Verified
        </Button>
        <Button
          variant={status === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus('rejected')}
        >
          Rejected
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading riders...</p>
      ) : data?.riders?.length ? (
        <ul className="space-y-3">
          {data.riders.map((rider) => (
            <li key={rider.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {rider.name || 'Unnamed rider'} · {rider.email}
                  </CardTitle>
                  <CardDescription>
                    {rider.vehicleType || 'Vehicle not set'} · {rider.serviceZone || 'Zone not set'} ·{' '}
                    {rider.phone || 'Phone not set'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">
                    Status: {rider.verificationStatus} / {rider.availabilityStatus}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === rider.id || rider.verificationStatus === 'verified'}
                      onClick={() => setVerification(rider, 'verified')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === rider.id || rider.verificationStatus === 'rejected'}
                      onClick={() => setVerification(rider, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No riders in this queue.</p>
      )}
    </section>
  );
}


import { desc, eq, inArray } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db/drizzle';
import {
  providerProfiles,
  serviceListings,
  serviceRequests,
  serviceReviews,
  teams,
  users,
} from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import {
  confirmServiceCompletionAction,
  createServiceListingAction,
  createServiceRequestAction,
  markServiceRequestPaidAction,
  submitServiceReviewAction,
  toggleListingActiveAction,
  updateServiceRequestStatusAction,
  upsertProviderProfileAction,
} from './actions';

function money(kobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default async function MarketplacePage() {
  const user = await getUser();
  const team = await getTeamForUser();
  if (!user || !team) {
    return null;
  }

  const isOwner = team.teamMembers.some(
    (member) => member.userId === user.id && member.role === 'owner'
  );

  const [profile] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.teamId, team.id))
    .limit(1);

  const listings = await db
    .select({
      id: serviceListings.id,
      teamId: serviceListings.teamId,
      title: serviceListings.title,
      category: serviceListings.category,
      description: serviceListings.description,
      priceKobo: serviceListings.priceKobo,
      pricingType: serviceListings.pricingType,
      availability: serviceListings.availability,
      isActive: serviceListings.isActive,
      createdAt: serviceListings.createdAt,
      providerName: providerProfiles.displayName,
      providerPhone: providerProfiles.contactPhone,
      providerWhatsapp: providerProfiles.contactWhatsapp,
      orgName: teams.name,
    })
    .from(serviceListings)
    .innerJoin(teams, eq(serviceListings.teamId, teams.id))
    .leftJoin(providerProfiles, eq(providerProfiles.teamId, serviceListings.teamId))
    .orderBy(desc(serviceListings.createdAt));

  const incomingRequests = await db
    .select({
      id: serviceRequests.id,
      status: serviceRequests.status,
      paymentStatus: serviceRequests.paymentStatus,
      grossAmountKobo: serviceRequests.grossAmountKobo,
      platformFeeKobo: serviceRequests.platformFeeKobo,
      providerEarningsKobo: serviceRequests.providerEarningsKobo,
      payoutStatus: serviceRequests.payoutStatus,
      message: serviceRequests.message,
      contactPhone: serviceRequests.contactPhone,
      createdAt: serviceRequests.createdAt,
      listingTitle: serviceListings.title,
      requesterEmail: users.email,
      requesterName: users.name,
    })
    .from(serviceRequests)
    .innerJoin(serviceListings, eq(serviceRequests.listingId, serviceListings.id))
    .innerJoin(users, eq(serviceRequests.requesterUserId, users.id))
    .where(eq(serviceRequests.providerTeamId, team.id))
    .orderBy(desc(serviceRequests.createdAt));

  const myRequests = await db
    .select({
      id: serviceRequests.id,
      status: serviceRequests.status,
      paymentStatus: serviceRequests.paymentStatus,
      grossAmountKobo: serviceRequests.grossAmountKobo,
      platformFeeKobo: serviceRequests.platformFeeKobo,
      providerEarningsKobo: serviceRequests.providerEarningsKobo,
      payoutStatus: serviceRequests.payoutStatus,
      message: serviceRequests.message,
      createdAt: serviceRequests.createdAt,
      listingTitle: serviceListings.title,
      providerOrg: teams.name,
      providerName: providerProfiles.displayName,
    })
    .from(serviceRequests)
    .innerJoin(serviceListings, eq(serviceRequests.listingId, serviceListings.id))
    .innerJoin(teams, eq(serviceRequests.providerTeamId, teams.id))
    .leftJoin(providerProfiles, eq(providerProfiles.teamId, teams.id))
    .where(eq(serviceRequests.requesterUserId, user.id))
    .orderBy(desc(serviceRequests.createdAt));

  const completedRequestIds = myRequests
    .filter((r) => r.status === 'completed')
    .map((r) => r.id);

  const existingReviews = completedRequestIds.length
    ? await db
        .select({ requestId: serviceReviews.requestId })
        .from(serviceReviews)
        .where(inArray(serviceReviews.requestId, completedRequestIds))
    : [];
  const reviewedRequestSet = new Set(existingReviews.map((r) => r.requestId));

  return (
    <section className="flex-1 p-4 lg:p-8 space-y-6">
      <header>
        <h1 className="text-lg lg:text-2xl font-medium mb-2">Student Marketplace</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Organizations can publish student services (cleaning, laundry, errands), set
          prices and availability, and accept bookings from other students.
        </p>
      </header>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Provider Profile (Your Organization)</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={upsertProviderProfileAction} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={profile?.displayName ?? team.name}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  defaultValue={profile?.contactPhone ?? ''}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactWhatsapp">WhatsApp</Label>
                <Input
                  id="contactWhatsapp"
                  name="contactWhatsapp"
                  defaultValue={profile?.contactWhatsapp ?? ''}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  name="bio"
                  defaultValue={profile?.bio ?? ''}
                  className="mt-1 w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Save provider profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Service Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createServiceListingAction} className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Service title</Label>
                <Input id="title" name="title" placeholder="Room cleaning" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Cleaning" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="priceNaira">Price (NGN)</Label>
                <Input id="priceNaira" name="priceNaira" placeholder="5000" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pricingType">Pricing type</Label>
                <select
                  id="pricingType"
                  name="pricingType"
                  className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  defaultValue="fixed"
                >
                  <option value="fixed">Fixed</option>
                  <option value="starting_from">Starting from</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  name="availability"
                  placeholder="Mon-Sat, 8AM - 6PM"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="What is included in this service?"
                  className="mt-1 w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Publish service
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services yet. Be the first to publish one.</p>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{listing.title}</h3>
                  <span className="text-sm text-orange-600 font-medium">
                    {money(listing.priceKobo)} {listing.pricingType === 'starting_from' ? '+' : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {listing.providerName || listing.orgName} • {listing.category}
                </p>
                {listing.description ? <p className="text-sm">{listing.description}</p> : null}
                {listing.availability ? (
                  <p className="text-xs text-muted-foreground">Availability: {listing.availability}</p>
                ) : null}
                {!listing.isActive ? (
                  <p className="text-xs text-red-600">This listing is paused by provider.</p>
                ) : null}

                {listing.teamId !== team.id && listing.isActive ? (
                  <form action={createServiceRequestAction} className="grid md:grid-cols-3 gap-2 pt-2">
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="providerTeamId" value={listing.teamId} />
                    <Input name="contactPhone" placeholder="Your phone" className="md:col-span-1" />
                    <Input name="message" placeholder="Service details or time request" className="md:col-span-2" />
                    <div className="md:col-span-3">
                      <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                        Request this service
                      </Button>
                    </div>
                  </form>
                ) : null}

                {listing.teamId === team.id && isOwner ? (
                  <form action={toggleListingActiveAction} className="pt-2">
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="makeActive" value={listing.isActive ? 'false' : 'true'} />
                    <Button type="submit" size="sm" variant="outline">
                      {listing.isActive ? 'Pause listing' : 'Activate listing'}
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Incoming Requests (For Your Organization)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : (
              incomingRequests.map((request) => (
                <div key={request.id} className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">{request.listingTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    By {request.requesterName || request.requesterEmail} • Status: {request.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Payment: {request.paymentStatus} • Gross: {money(request.grossAmountKobo)} •
                    Platform fee (5%): {money(request.platformFeeKobo)} • Provider earns:{' '}
                    {money(request.providerEarningsKobo)}
                  </p>
                  {request.message ? <p className="text-sm">{request.message}</p> : null}
                  {request.contactPhone ? (
                    <p className="text-xs text-muted-foreground">Contact: {request.contactPhone}</p>
                  ) : null}
                  <div className="flex gap-2 flex-wrap">
                    {['accepted', 'in_progress', 'completed'].map((status) => (
                      <form key={status} action={updateServiceRequestStatusAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="status" value={status} />
                        <Button type="submit" size="sm" variant="outline">
                          {status === 'completed'
                            ? 'Mark work done (await customer confirm)'
                            : `Mark ${status.replace('_', ' ')}`}
                        </Button>
                      </form>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>My Service Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not requested any service yet.</p>
          ) : (
            myRequests.map((request) => (
              <div key={request.id} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">{request.listingTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Provider: {request.providerName || request.providerOrg} • Status: {request.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  You pay: {money(request.grossAmountKobo)} • Platform fee included: {money(request.platformFeeKobo)}{' '}
                  (5%) • Provider receives: {money(request.providerEarningsKobo)}
                </p>
                {request.paymentStatus !== 'paid' ? (
                  <form action={markServiceRequestPaidAction} className="pt-1">
                    <input type="hidden" name="requestId" value={request.id} />
                    <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                      Pay via platform
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs text-green-600">Payment received by platform.</p>
                )}
                {request.status === 'awaiting_confirmation' ? (
                  <form action={confirmServiceCompletionAction} className="pt-1">
                    <input type="hidden" name="requestId" value={request.id} />
                    <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                      Confirm service completion
                    </Button>
                  </form>
                ) : null}
                {request.payoutStatus === 'ready_for_payout' ? (
                  <p className="text-xs text-green-700">
                    Completion confirmed. Provider payout is now ready.
                  </p>
                ) : null}
                {request.message ? <p className="text-sm">{request.message}</p> : null}
                {request.status === 'completed' && !reviewedRequestSet.has(request.id) ? (
                  <form action={submitServiceReviewAction} className="grid md:grid-cols-3 gap-2 pt-1">
                    <input type="hidden" name="requestId" value={request.id} />
                    <select
                      name="rating"
                      className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      defaultValue="5"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Okay</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Bad</option>
                    </select>
                    <Input name="comment" placeholder="Optional review comment" className="md:col-span-2" />
                    <div className="md:col-span-3">
                      <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                        Submit rating
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

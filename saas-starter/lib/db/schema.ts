import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  oauthProvider: varchar('oauth_provider', { length: 50 }),
  oauthSub: varchar('oauth_sub', { length: 255 }),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
  subscriptionRenewsAt: timestamp('subscription_renews_at'),
  lastPaystackPaymentReference: varchar('last_paystack_payment_reference', {
    length: 120
  }),
  /** JSON: logisticsOrgId, gigOrgId, retailOrgId for upstream tenancy */
  integrationMappings: text('integration_mappings'),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

/** Rider onboarding + availability state for gig/logistics booking flows. */
export const riderProfiles = pgTable(
  'rider_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    phone: varchar('phone', { length: 30 }),
    vehicleType: varchar('vehicle_type', { length: 40 }),
    serviceZone: varchar('service_zone', { length: 100 }),
    verificationStatus: varchar('verification_status', { length: 20 })
      .notNull()
      .default('pending'),
    availabilityStatus: varchar('availability_status', { length: 20 })
      .notNull()
      .default('offline'),
    photoUrl: text('photo_url'),
    avgRating: integer('avg_rating').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    bankCode: varchar('bank_code', { length: 12 }),
    accountNumber: varchar('account_number', { length: 20 }),
    accountName: varchar('account_name', { length: 120 }),
    paystackRecipientCode: varchar('paystack_recipient_code', { length: 80 }),
    kycNotes: text('kyc_notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    riderUserUnique: uniqueIndex('rider_profiles_user_unique').on(t.userId),
  })
);

/** Dedupe inbound webhooks by Idempotency-Key + source (§3.8 / productized ingress). */
export const webhookInbox = pgTable(
  'webhook_inbox',
  {
    id: serial('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    source: varchar('source', { length: 32 }).notNull(),
    teamId: integer('team_id').references(() => teams.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    keySourceIdx: uniqueIndex('webhook_inbox_key_source').on(
      t.idempotencyKey,
      t.source
    ),
  })
);

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

/** Student marketplace provider/org profile. */
export const providerProfiles = pgTable(
  'provider_profiles',
  {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    bio: text('bio'),
    contactPhone: varchar('contact_phone', { length: 30 }),
    contactWhatsapp: varchar('contact_whatsapp', { length: 30 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    providerTeamUnique: uniqueIndex('provider_profiles_team_unique').on(t.teamId),
  })
);

export const serviceListings = pgTable('service_listings', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  title: varchar('title', { length: 120 }).notNull(),
  category: varchar('category', { length: 60 }).notNull(),
  description: text('description'),
  priceKobo: integer('price_kobo').notNull(),
  pricingType: varchar('pricing_type', { length: 20 }).notNull().default('fixed'),
  availability: text('availability'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const serviceRequests = pgTable('service_requests', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id')
    .notNull()
    .references(() => serviceListings.id),
  requesterUserId: integer('requester_user_id')
    .notNull()
    .references(() => users.id),
  providerTeamId: integer('provider_team_id')
    .notNull()
    .references(() => teams.id),
  message: text('message'),
  contactPhone: varchar('contact_phone', { length: 30 }),
  status: varchar('status', { length: 20 }).notNull().default('requested'),
  paymentStatus: varchar('payment_status', { length: 20 })
    .notNull()
    .default('unpaid'),
  grossAmountKobo: integer('gross_amount_kobo').notNull(),
  platformFeeKobo: integer('platform_fee_kobo').notNull(),
  providerEarningsKobo: integer('provider_earnings_kobo').notNull(),
  paystackReference: varchar('paystack_reference', { length: 120 }),
  paidAt: timestamp('paid_at'),
  providerCompletedAt: timestamp('provider_completed_at'),
  customerConfirmedAt: timestamp('customer_confirmed_at'),
  payoutStatus: varchar('payout_status', { length: 30 })
    .notNull()
    .default('not_ready'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const serviceReviews = pgTable(
  'service_reviews',
  {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
      .notNull()
      .references(() => serviceRequests.id),
    reviewerUserId: integer('reviewer_user_id')
      .notNull()
      .references(() => users.id),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    reviewPerRequestUnique: uniqueIndex('service_reviews_request_unique').on(
      t.requestId
    ),
  })
);

export const riderLocations = pgTable(
  'rider_locations',
  {
    id: serial('id').primaryKey(),
    riderProfileId: integer('rider_profile_id')
      .notNull()
      .references(() => riderProfiles.id),
    lat: integer('lat').notNull(),
    lng: integer('lng').notNull(),
    heading: integer('heading'),
    isOnline: boolean('is_online').notNull().default(false),
    lastSeenAt: timestamp('last_seen_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    riderLocationUnique: uniqueIndex('rider_locations_rider_profile_unique').on(
      t.riderProfileId
    ),
  })
);

export const riderBookings = pgTable('rider_bookings', {
  id: serial('id').primaryKey(),
  customerUserId: integer('customer_user_id')
    .notNull()
    .references(() => users.id),
  riderProfileId: integer('rider_profile_id').references(() => riderProfiles.id),
  pickupLabel: varchar('pickup_label', { length: 160 }).notNull(),
  dropoffLabel: varchar('dropoff_label', { length: 160 }).notNull(),
  pickupLat: integer('pickup_lat').notNull(),
  pickupLng: integer('pickup_lng').notNull(),
  dropoffLat: integer('dropoff_lat').notNull(),
  dropoffLng: integer('dropoff_lng').notNull(),
  quotedFareKobo: integer('quoted_fare_kobo').notNull(),
  grossAmountKobo: integer('gross_amount_kobo').notNull(),
  platformFeeKobo: integer('platform_fee_kobo').notNull(),
  riderNetKobo: integer('rider_net_kobo').notNull(),
  paystackReference: varchar('paystack_reference', { length: 120 }),
  paymentStatus: varchar('payment_status', { length: 20 })
    .notNull()
    .default('unpaid'),
  bookingStatus: varchar('booking_status', { length: 30 })
    .notNull()
    .default('requested'),
  paidAt: timestamp('paid_at'),
  riderAcceptedAt: timestamp('rider_accepted_at'),
  riderStartedAt: timestamp('rider_started_at'),
  riderCompletedAt: timestamp('rider_completed_at'),
  customerConfirmedAt: timestamp('customer_confirmed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const riderReviews = pgTable(
  'rider_reviews',
  {
    id: serial('id').primaryKey(),
    bookingId: integer('booking_id')
      .notNull()
      .references(() => riderBookings.id),
    customerUserId: integer('customer_user_id')
      .notNull()
      .references(() => users.id),
    riderProfileId: integer('rider_profile_id')
      .notNull()
      .references(() => riderProfiles.id),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    riderReviewBookingUnique: uniqueIndex('rider_reviews_booking_unique').on(
      t.bookingId
    ),
  })
);

export const payoutLedger = pgTable('payout_ledger', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .notNull()
    .references(() => riderBookings.id),
  riderProfileId: integer('rider_profile_id')
    .notNull()
    .references(() => riderProfiles.id),
  amountNetKobo: integer('amount_net_kobo').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('ready_for_payout'),
  releaseAfterAt: timestamp('release_after_at'),
  transferReference: varchar('transfer_reference', { length: 120 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  providerProfiles: many(providerProfiles),
  serviceListings: many(serviceListings),
  serviceRequests: many(serviceRequests),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  riderProfiles: many(riderProfiles),
  serviceRequests: many(serviceRequests),
  serviceReviews: many(serviceReviews),
  riderBookings: many(riderBookings),
  riderReviews: many(riderReviews),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const riderProfilesRelations = relations(riderProfiles, ({ one }) => ({
  user: one(users, {
    fields: [riderProfiles.userId],
    references: [users.id],
  }),
}));

export const riderLocationsRelations = relations(riderLocations, ({ one }) => ({
  riderProfile: one(riderProfiles, {
    fields: [riderLocations.riderProfileId],
    references: [riderProfiles.id],
  }),
}));

export const riderBookingsRelations = relations(riderBookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [riderBookings.customerUserId],
    references: [users.id],
  }),
  rider: one(riderProfiles, {
    fields: [riderBookings.riderProfileId],
    references: [riderProfiles.id],
  }),
  reviews: many(riderReviews),
  payouts: many(payoutLedger),
}));

export const riderReviewsRelations = relations(riderReviews, ({ one }) => ({
  booking: one(riderBookings, {
    fields: [riderReviews.bookingId],
    references: [riderBookings.id],
  }),
  customer: one(users, {
    fields: [riderReviews.customerUserId],
    references: [users.id],
  }),
  rider: one(riderProfiles, {
    fields: [riderReviews.riderProfileId],
    references: [riderProfiles.id],
  }),
}));

export const payoutLedgerRelations = relations(payoutLedger, ({ one }) => ({
  booking: one(riderBookings, {
    fields: [payoutLedger.bookingId],
    references: [riderBookings.id],
  }),
  rider: one(riderProfiles, {
    fields: [payoutLedger.riderProfileId],
    references: [riderProfiles.id],
  }),
}));

export const providerProfilesRelations = relations(
  providerProfiles,
  ({ one }) => ({
    team: one(teams, {
      fields: [providerProfiles.teamId],
      references: [teams.id],
    }),
  })
);

export const serviceListingsRelations = relations(serviceListings, ({ one, many }) => ({
  team: one(teams, {
    fields: [serviceListings.teamId],
    references: [teams.id],
  }),
  requests: many(serviceRequests),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  listing: one(serviceListings, {
    fields: [serviceRequests.listingId],
    references: [serviceListings.id],
  }),
  requester: one(users, {
    fields: [serviceRequests.requesterUserId],
    references: [users.id],
  }),
  providerTeam: one(teams, {
    fields: [serviceRequests.providerTeamId],
    references: [teams.id],
  }),
  reviews: many(serviceReviews),
}));

export const serviceReviewsRelations = relations(serviceReviews, ({ one }) => ({
  request: one(serviceRequests, {
    fields: [serviceReviews.requestId],
    references: [serviceRequests.id],
  }),
  reviewer: one(users, {
    fields: [serviceReviews.reviewerUserId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type RiderProfile = typeof riderProfiles.$inferSelect;
export type NewRiderProfile = typeof riderProfiles.$inferInsert;
export type RiderLocation = typeof riderLocations.$inferSelect;
export type NewRiderLocation = typeof riderLocations.$inferInsert;
export type RiderBooking = typeof riderBookings.$inferSelect;
export type NewRiderBooking = typeof riderBookings.$inferInsert;
export type RiderReview = typeof riderReviews.$inferSelect;
export type NewRiderReview = typeof riderReviews.$inferInsert;
export type PayoutLedger = typeof payoutLedger.$inferSelect;
export type NewPayoutLedger = typeof payoutLedger.$inferInsert;
export type WebhookInbox = typeof webhookInbox.$inferSelect;
export type NewWebhookInbox = typeof webhookInbox.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type NewProviderProfile = typeof providerProfiles.$inferInsert;
export type ServiceListing = typeof serviceListings.$inferSelect;
export type NewServiceListing = typeof serviceListings.$inferInsert;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
export type ServiceReview = typeof serviceReviews.$inferSelect;
export type NewServiceReview = typeof serviceReviews.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  /** Cross-service integration webhook (payload may include teamId) */
  WEBHOOK_INTEGRATION = 'WEBHOOK_INTEGRATION',
  /** Domain payout / settlement webhook */
  WEBHOOK_PAYMENT_DOMAIN = 'WEBHOOK_PAYMENT_DOMAIN'
}

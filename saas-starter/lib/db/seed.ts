import { and, eq } from 'drizzle-orm';
import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  riderProfiles,
  riderLocations,
  providerProfiles,
  serviceListings,
  retailWarehouses,
  retailCategories,
  retailBrands,
  retailUnits,
  retailItems
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { toMicroDegrees } from '@/lib/rides/geo';

/** Legacy quick-login from README */
const LEGACY_EMAIL = 'test@test.com';
const LEGACY_PASSWORD = 'admin123';

/** Shared password for all persona test accounts below */
const TEST_PASSWORD = 'IbaHubTest1!';

const RETAIL_TEAM_NAME = 'Demo Retail (IbaHub)';
const SERVICES_TEAM_NAME = 'Demo Services (IbaHub)';

type SeedUser = {
  email: string;
  name: string;
  role: string;
};

const PERSONAS: SeedUser[] = [
  { email: 'admin@ibahub.test', name: 'Platform Admin', role: 'admin' },
  { email: 'owner@ibahub.test', name: 'Business Owner', role: 'owner' },
  { email: 'staff@ibahub.test', name: 'Team Staff', role: 'member' },
  { email: 'buyer@ibahub.test', name: 'Shop Buyer', role: 'member' },
  { email: 'rider@ibahub.test', name: 'Verified Rider', role: 'member' },
  { email: 'services@ibahub.test', name: 'Service Provider', role: 'owner' }
];

async function upsertUser(
  email: string,
  name: string,
  role: string,
  passwordHash: string
): Promise<number> {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    await db
      .update(users)
      .set({ name, role, passwordHash, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(users)
    .values({ email, name, role, passwordHash })
    .returning();
  return row.id;
}

async function ensureTeamMember(userId: number, teamId: number, role: string) {
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1);
  if (existing) {
    if (existing.role !== role) {
      await db
        .update(teamMembers)
        .set({ role })
        .where(eq(teamMembers.id, existing.id));
    }
    return;
  }
  await db.insert(teamMembers).values({ userId, teamId, role });
}

async function ensureTeam(
  name: string,
  patch: Partial<typeof teams.$inferInsert>
): Promise<{ id: number }> {
  const [existing] = await db.select().from(teams).where(eq(teams.name, name)).limit(1);
  if (existing) {
    await db
      .update(teams)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(teams.id, existing.id));
    return { id: existing.id };
  }
  const [row] = await db.insert(teams).values({ name, ...patch }).returning();
  return { id: row.id };
}

async function ensureRiderProfile(userId: number) {
  const [existing] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.userId, userId))
    .limit(1);
  if (existing) {
    await db
      .update(riderProfiles)
      .set({
        verificationStatus: 'verified',
        availabilityStatus: 'available',
        phone: '+2348000000001',
        vehicleType: 'bike',
        serviceZone: 'Lagos',
        updatedAt: new Date()
      })
      .where(eq(riderProfiles.id, existing.id));
    return existing.id;
  }
  const [row] = await db
    .insert(riderProfiles)
    .values({
      userId,
      phone: '+2348000000001',
      vehicleType: 'bike',
      serviceZone: 'Lagos',
      verificationStatus: 'verified',
      availabilityStatus: 'available'
    })
    .returning();
  return row.id;
}

async function ensureRiderLocation(riderProfileId: number) {
  const lat = toMicroDegrees(6.5244);
  const lng = toMicroDegrees(3.3792);
  const [existing] = await db
    .select()
    .from(riderLocations)
    .where(eq(riderLocations.riderProfileId, riderProfileId))
    .limit(1);
  if (existing) {
    await db
      .update(riderLocations)
      .set({
        lat,
        lng,
        heading: 0,
        isOnline: true,
        updatedAt: new Date()
      })
      .where(eq(riderLocations.id, existing.id));
    return;
  }
  await db.insert(riderLocations).values({
    riderProfileId,
    lat,
    lng,
    heading: 0,
    isOnline: true
  });
}

async function ensureRetailBaseline(teamId: number) {
  const [wh] = await db
    .select()
    .from(retailWarehouses)
    .where(eq(retailWarehouses.teamId, teamId))
    .limit(1);
  const warehouseId =
    wh?.id ??
    (
      await db
        .insert(retailWarehouses)
        .values({ teamId, name: 'Main warehouse', address: 'Lagos' })
        .returning()
    )[0].id;

  const [cat] = await db
    .select()
    .from(retailCategories)
    .where(eq(retailCategories.teamId, teamId))
    .limit(1);
  const categoryId =
    cat?.id ??
    (
      await db
        .insert(retailCategories)
        .values({ teamId, name: 'General', description: 'Seeded category' })
        .returning()
    )[0].id;

  const [brand] = await db
    .select()
    .from(retailBrands)
    .where(eq(retailBrands.teamId, teamId))
    .limit(1);
  const brandId =
    brand?.id ??
    (
      await db
        .insert(retailBrands)
        .values({ teamId, name: 'Demo Brand' })
        .returning()
    )[0].id;

  const [unit] = await db
    .select()
    .from(retailUnits)
    .where(eq(retailUnits.teamId, teamId))
    .limit(1);
  const unitId =
    unit?.id ??
    (
      await db
        .insert(retailUnits)
        .values({ teamId, name: 'Piece', abbreviation: 'pc' })
        .returning()
    )[0].id;

  const [item] = await db
    .select()
    .from(retailItems)
    .where(and(eq(retailItems.teamId, teamId), eq(retailItems.sku, 'SEED-DEMO-001')))
    .limit(1);
  if (!item) {
    await db.insert(retailItems).values({
      teamId,
      name: 'Demo product',
      sku: 'SEED-DEMO-001',
      categoryId,
      brandId,
      unitId,
      warehouseId,
      quantity: 25,
      sellingPriceKobo: 500000,
      purchasePriceKobo: 300000
    });
  }
}

async function ensureProviderAndListing(teamId: number) {
  const [pp] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.teamId, teamId))
    .limit(1);
  if (!pp) {
    await db.insert(providerProfiles).values({
      teamId,
      displayName: 'Demo Services Desk',
      bio: 'Seeded marketplace provider profile',
      contactPhone: '+2348000000002',
      isActive: true
    });
  }

  const listings = await db
    .select()
    .from(serviceListings)
    .where(eq(serviceListings.teamId, teamId))
    .limit(1);
  if (!listings[0]) {
    await db.insert(serviceListings).values({
      teamId,
      title: 'Demo tutoring session',
      category: 'education',
      description: 'Seeded listing for marketplace testing',
      priceKobo: 1000000,
      pricingType: 'fixed',
      isActive: true
    });
  }
}

async function seed() {
  const legacyHash = await hashPassword(LEGACY_PASSWORD);
  const testHash = await hashPassword(TEST_PASSWORD);

  const legacyId = await upsertUser(LEGACY_EMAIL, 'Legacy Test User', 'owner', legacyHash);
  console.log(`Upserted legacy user ${LEGACY_EMAIL} (password: ${LEGACY_PASSWORD})`);

  const legacyTeam = await ensureTeam('Test Team', {
    subscriptionStatus: 'active',
    planName: 'Business',
    inventoryAddonActive: false
  });
  await ensureTeamMember(legacyId, legacyTeam.id, 'owner');

  const idByEmail = new Map<string, number>();
  for (const p of PERSONAS) {
    const id = await upsertUser(p.email, p.name, p.role, testHash);
    idByEmail.set(p.email, id);
  }

  const retailTeam = await ensureTeam(RETAIL_TEAM_NAME, {
    subscriptionStatus: 'active',
    planName: 'Business + Inventory',
    inventoryAddonActive: true,
    isStorefrontPublic: true,
    shopSlug: 'demo-shop',
    businessProfileCompleted: true,
    businessPhone: '+2348000000000',
    businessAddress: 'Lagos, Nigeria',
    businessLat: toMicroDegrees(6.5244),
    businessLng: toMicroDegrees(3.3792)
  });

  const servicesTeam = await ensureTeam(SERVICES_TEAM_NAME, {
    subscriptionStatus: 'active',
    planName: 'Business',
    inventoryAddonActive: false,
    isStorefrontPublic: true,
    shopSlug: 'demo-services',
    businessProfileCompleted: true
  });

  await ensureTeamMember(idByEmail.get('owner@ibahub.test')!, retailTeam.id, 'owner');
  await ensureTeamMember(idByEmail.get('staff@ibahub.test')!, retailTeam.id, 'member');
  await ensureTeamMember(idByEmail.get('services@ibahub.test')!, servicesTeam.id, 'owner');

  const riderPid = await ensureRiderProfile(idByEmail.get('rider@ibahub.test')!);
  await ensureRiderLocation(riderPid);

  await ensureRetailBaseline(retailTeam.id);
  await ensureProviderAndListing(servicesTeam.id);

  console.log('\n=== IbaHub persona accounts (password for all below) ===');
  console.log(`Password: ${TEST_PASSWORD}`);
  for (const p of PERSONAS) {
    console.log(`  ${p.email} — ${p.name} (${p.role})`);
  }
  console.log('\nRoles:');
  console.log('  admin@ibahub.test — platform admin routes (/dashboard/hub/payments/*, admin APIs)');
  console.log('  owner@ibahub.test — business owner (retail dashboard, shop owner)');
  console.log('  staff@ibahub.test — team member on demo retail team');
  console.log('  buyer@ibahub.test — customer only (no team; use storefront /shops)');
  console.log('  rider@ibahub.test — verified rider (/dashboard/rides/rider)');
  console.log('  services@ibahub.test — marketplace provider team owner');
  console.log(`\nLegacy: ${LEGACY_EMAIL} / ${LEGACY_PASSWORD} — linked to "Test Team" (seeded).`);
  console.log('\nStorefront: /shops/demo-shop (slug)');
  console.log('Skipping external billing product seed (Paystack mode).');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('\nSeed process finished. Exiting...');
    process.exit(0);
  });

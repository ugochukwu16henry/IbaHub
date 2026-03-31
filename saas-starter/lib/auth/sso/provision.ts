import 'server-only';

import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  activityLogs,
  teamMembers,
  teams,
  users,
  ActivityType,
  type NewTeam,
  type NewTeamMember,
  type NewUser
} from '@/lib/db/schema';
import { hashPassword, setSessionOnResponse } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

type OAuthProfile = {
  email: string;
  name: string | null;
  provider: string;
  sub: string;
};

export async function completeOAuthAndRedirect(
  profile: OAuthProfile
): Promise<NextResponse> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, profile.email))
    .limit(1);

  if (existing) {
    if (
      existing.oauthSub &&
      (existing.oauthProvider !== profile.provider ||
        existing.oauthSub !== profile.sub)
    ) {
      return NextResponse.redirect(
        new URL(
          '/sign-in?error=oauth_account_conflict',
          process.env.BASE_URL || 'http://localhost:3000'
        )
      );
    }

    await db
      .update(users)
      .set({
        oauthProvider: profile.provider,
        oauthSub: profile.sub,
        name: existing.name || profile.name,
        updatedAt: new Date()
      })
      .where(eq(users.id, existing.id));

    const res = NextResponse.redirect(
      new URL('/dashboard', process.env.BASE_URL || 'http://localhost:3000')
    );
    await setSessionOnResponse(res, existing);
    return res;
  }

  const passwordHash = await hashPassword(randomUUID());
  const newUser: NewUser = {
    email: profile.email,
    passwordHash,
    name: profile.name,
    role: 'owner',
    oauthProvider: profile.provider,
    oauthSub: profile.sub
  };

  const [created] = await db.insert(users).values(newUser).returning();
  if (!created) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_create_failed', process.env.BASE_URL || 'http://localhost:3000')
    );
  }

  const newTeam: NewTeam = { name: `${profile.email}'s Team` };
  const [createdTeam] = await db.insert(teams).values(newTeam).returning();
  if (!createdTeam) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_team_failed', process.env.BASE_URL || 'http://localhost:3000')
    );
  }

  const member: NewTeamMember = {
    userId: created.id,
    teamId: createdTeam.id,
    role: 'owner'
  };

  await db.insert(teamMembers).values(member);
  await db.insert(activityLogs).values({
    teamId: createdTeam.id,
    userId: created.id,
    action: ActivityType.CREATE_TEAM,
    ipAddress: ''
  });
  await db.insert(activityLogs).values({
    teamId: createdTeam.id,
    userId: created.id,
    action: ActivityType.SIGN_UP,
    ipAddress: ''
  });

  const res = NextResponse.redirect(
    new URL('/dashboard', process.env.BASE_URL || 'http://localhost:3000')
  );
  await setSessionOnResponse(res, created);
  return res;
}

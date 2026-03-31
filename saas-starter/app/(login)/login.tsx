'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

const OAUTH_ERROR_HINT: Record<string, string> = {
  oauth_state: 'SSO session expired or invalid. Try again.',
  oauth_account_conflict: 'This email is already linked to another SSO identity.',
  oauth_token: 'Could not exchange SSO code. Check client credentials.',
  oauth_jwt: 'SSO identity token could not be verified.',
  oauth_no_email: 'Your IdP did not return an email claim.',
  oauth_email_unverified: 'Email must be verified with your IdP.',
  oauth_no_sub: 'Your IdP did not return a subject (sub) claim.',
  oauth_no_id_token: 'No ID token from IdP.',
  oauth_create_failed: 'Could not create account.',
  oauth_team_failed: 'Could not create team.',
  sso_disabled: 'SSO is not configured on the server.'
};

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const urlError = searchParams.get('error');
  const ssoEnabled = process.env.NEXT_PUBLIC_AUTH_SSO_ENABLED === 'true';
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  const oauthHint = urlError ? OAUTH_ERROR_HINT[urlError] ?? urlError : null;

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {ssoEnabled ? (
          <div className="mb-6">
            <a
              href="/api/auth/sso/start"
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50"
            >
              Continue with SSO (OIDC)
            </a>
            <p className="mt-2 text-xs text-center text-gray-500">
              OpenID Connect (PKCE). Configure AUTH_SSO_* in env.
            </p>
          </div>
        ) : null}

        {oauthHint ? (
          <div className="mb-4 text-sm text-red-600">{oauthHint}</div>
        ) : null}

        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
          {mode === 'signup' ? (
            <div>
              <Label
                htmlFor="accountType"
                className="block text-sm font-medium text-gray-700"
              >
                Account type
              </Label>
              <select
                id="accountType"
                name="accountType"
                className="mt-1 w-full rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                defaultValue="member"
              >
                <option value="member">Customer / Member</option>
                <option value="rider">Rider</option>
              </select>
            </div>
          ) : null}
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>
          {mode === 'signup' ? (
            <>
              <div>
                <Label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone (required for rider onboarding)
                </Label>
                <div className="mt-1">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="+234..."
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="vehicleType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Vehicle type (rider only)
                </Label>
                <div className="mt-1">
                  <Input
                    id="vehicleType"
                    name="vehicleType"
                    type="text"
                    maxLength={40}
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="Bike / Tricycle / Car"
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="serviceZone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Service zone (rider only)
                </Label>
                <div className="mt-1">
                  <Input
                    id="serviceZone"
                    name="serviceZone"
                    type="text"
                    maxLength={100}
                    className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                    placeholder="Uyo Plaza / Itam / Uniuyo axis"
                  />
                </div>
              </div>
            </>
          ) : null}

          {state?.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

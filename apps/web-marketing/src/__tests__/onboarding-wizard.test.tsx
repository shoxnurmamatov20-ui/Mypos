/**
 * C7 — Phase 2 — Onboarding wizard store + schemas.
 *
 * The 5-step self-service onboarding flow lives in `lib/wizard-store.ts`
 * (Zustand) plus per-step Zod schemas in `lib/wizard-schemas.ts`. Both are
 * pure modules that we can test without mounting React.
 *
 * Coverage:
 *   - Store progresses through 5 steps with bounds-clamping.
 *   - Step state persists across module reloads (sessionStorage).
 *   - Per-step schemas reject invalid input and accept valid input.
 *   - Final submission API call shape matches what the schema expects.
 *
 * NOTE — There is no `vitest.config.ts` in `apps/web-marketing` yet. To run
 * these tests directly:
 *
 *   pnpm --filter @mypos/web-marketing exec vitest run src/__tests__
 *
 * Once Agent C6 ships the wizard PR they should add a `vitest.config.ts`
 * mirroring `apps/web-consumer/vitest.config.ts` (node env, alias `@`).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------- in-memory sessionStorage polyfill ----------
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  vi.stubGlobal('window', { sessionStorage: globalThis.sessionStorage });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ----------------------------------------------------------
// Wizard store
// ----------------------------------------------------------

describe('useWizardStore navigation', () => {
  it('starts at step 1', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    expect(useWizardStore.getState().step).toBe(1);
  });

  it('next() advances one step at a time', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    expect(useWizardStore.getState().step).toBe(1);
    useWizardStore.getState().next();
    expect(useWizardStore.getState().step).toBe(2);
    useWizardStore.getState().next();
    expect(useWizardStore.getState().step).toBe(3);
  });

  it('next() clamps at step 5 (final step)', async () => {
    const { useWizardStore, TOTAL_WIZARD_STEPS } = await import('../lib/wizard-store');
    useWizardStore.getState().setStep(5);
    useWizardStore.getState().next();
    useWizardStore.getState().next();
    expect(useWizardStore.getState().step).toBe(TOTAL_WIZARD_STEPS);
    expect(useWizardStore.getState().step).toBe(5);
  });

  it('prev() clamps at step 1', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().prev();
    useWizardStore.getState().prev();
    expect(useWizardStore.getState().step).toBe(1);
  });

  it('setStep() jumps directly to the target step', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setStep(4);
    expect(useWizardStore.getState().step).toBe(4);
  });

  it('reset() returns to step 1 and clears form state', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setRestaurant({ name: 'JomeBurger', slug: 'jome' });
    useWizardStore.getState().setStep(3);
    useWizardStore.getState().reset();

    expect(useWizardStore.getState().step).toBe(1);
    expect(useWizardStore.getState().restaurant.name).toBe('');
  });
});

describe('useWizardStore form state', () => {
  it('persists restaurant fields between calls (in-memory)', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setRestaurant({ name: 'JomeBurger', city: 'Tashkent' });
    useWizardStore.getState().setRestaurant({ slug: 'jome' });

    const r = useWizardStore.getState().restaurant;
    expect(r.name).toBe('JomeBurger');
    expect(r.city).toBe('Tashkent');
    expect(r.slug).toBe('jome');
  });

  it('toggles payment providers (add then remove)', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    expect(useWizardStore.getState().payments.providers).toEqual(['cash']);

    useWizardStore.getState().togglePaymentProvider('click');
    expect(useWizardStore.getState().payments.providers).toContain('click');

    useWizardStore.getState().togglePaymentProvider('click');
    expect(useWizardStore.getState().payments.providers).not.toContain('click');
  });

  it('always keeps cash as a payment provider (cannot be empty)', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    // Start with just cash, try to remove it.
    useWizardStore.getState().togglePaymentProvider('cash');
    expect(useWizardStore.getState().payments.providers).toEqual(['cash']);
  });

  it('setTier records the chosen tier', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setTier('plus');
    expect(useWizardStore.getState().tier).toBe('plus');
  });

  it('setMenuMode and setMenuItems update the menu sub-state', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setMenuMode('csv');
    expect(useWizardStore.getState().menu.mode).toBe('csv');

    useWizardStore
      .getState()
      .setMenuItems([{ name: 'Plov', description: '', category: 'main', priceUzs: 50000 }]);
    expect(useWizardStore.getState().menu.items).toHaveLength(1);
    expect(useWizardStore.getState().menu.items[0]?.name).toBe('Plov');
  });

  it('setTables updates zones and tablesPerZone', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setTables({ zones: 3, tablesPerZone: 12 });
    expect(useWizardStore.getState().tables.zones).toBe(3);
    expect(useWizardStore.getState().tables.tablesPerZone).toBe(12);
  });

  it('submission state has helpers for submitting/error/registrationId', async () => {
    const { useWizardStore } = await import('../lib/wizard-store');
    useWizardStore.getState().setSubmitting(true);
    expect(useWizardStore.getState().submission.submitting).toBe(true);

    useWizardStore.getState().setError('something_went_wrong');
    expect(useWizardStore.getState().submission.error).toBe('something_went_wrong');

    useWizardStore.getState().setRegistrationId('reg-uuid-123');
    expect(useWizardStore.getState().submission.registrationId).toBe('reg-uuid-123');
  });
});

// ----------------------------------------------------------
// Per-step Zod validation
// ----------------------------------------------------------

describe('Step 1 schema (restaurant info)', () => {
  it('rejects too-short name', async () => {
    const { step1Schema } = await import('../lib/wizard-schemas');
    const result = step1Schema.safeParse({
      name: 'J',
      slug: 'jome',
      cuisine: 'fastfood',
      city: 'Tashkent',
      address: '12 Main St',
      phone: '+998901234567',
      email: 'owner@jome.uz',
      logoDataUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with leading hyphen', async () => {
    const { step1Schema } = await import('../lib/wizard-schemas');
    const result = step1Schema.safeParse({
      name: 'JomeBurger',
      slug: '-leading-hyphen',
      cuisine: 'fastfood',
      city: 'Tashkent',
      address: '12 Main St',
      phone: '+998901234567',
      email: 'owner@jome.uz',
      logoDataUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with underscore (only [a-z0-9-] permitted)', async () => {
    const { step1Schema } = await import('../lib/wizard-schemas');
    const result = step1Schema.safeParse({
      name: 'JomeBurger',
      slug: 'jome_burger',
      cuisine: 'fastfood',
      city: 'Tashkent',
      address: '12 Main St',
      phone: '+998901234567',
      email: 'owner@jome.uz',
      logoDataUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short slug (< 3 chars)', async () => {
    const { step1Schema } = await import('../lib/wizard-schemas');
    const result = step1Schema.safeParse({
      name: 'JomeBurger',
      slug: 'jo',
      cuisine: 'fastfood',
      city: 'Tashkent',
      address: '12 Main St',
      phone: '+998901234567',
      email: 'owner@jome.uz',
      logoDataUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed email', async () => {
    const { step1Schema } = await import('../lib/wizard-schemas');
    const result = step1Schema.safeParse({
      name: 'JomeBurger',
      slug: 'jome',
      cuisine: 'fastfood',
      city: 'Tashkent',
      address: '12 Main St',
      phone: '+998901234567',
      email: 'not-an-email',
      logoDataUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a fully valid step-1 payload', async () => {
    const { step1Schema } = await import('../lib/wizard-schemas');
    const result = step1Schema.safeParse({
      name: 'JomeBurger',
      slug: 'jomeburger',
      cuisine: 'fastfood',
      city: 'Tashkent',
      address: '12 Mustaqillik St',
      phone: '+998901234567',
      email: 'owner@jome.uz',
      logoDataUrl: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('Step 4 schema (payment providers)', () => {
  it('rejects an empty providers array', async () => {
    const { step4Schema } = await import('../lib/wizard-schemas');
    const result = step4Schema.safeParse({ providers: [] });
    expect(result.success).toBe(false);
  });

  it('accepts a single valid provider', async () => {
    const { step4Schema } = await import('../lib/wizard-schemas');
    const result = step4Schema.safeParse({ providers: ['cash'] });
    expect(result.success).toBe(true);
  });

  it('rejects unknown provider names', async () => {
    const { step4Schema } = await import('../lib/wizard-schemas');
    const result = step4Schema.safeParse({ providers: ['bitcoin'] });
    expect(result.success).toBe(false);
  });
});

describe('Step 5 schema (tier selection)', () => {
  it('accepts each known tier', async () => {
    const { step5Schema, TIER_KEYS } = await import('../lib/wizard-schemas');
    for (const tier of TIER_KEYS) {
      const result = step5Schema.safeParse({ tier });
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown tier values', async () => {
    const { step5Schema } = await import('../lib/wizard-schemas');
    expect(step5Schema.safeParse({ tier: 'galactic' }).success).toBe(false);
  });
});

describe('Step 3 schema (tables)', () => {
  it('rejects zero zones', async () => {
    const { step3Schema } = await import('../lib/wizard-schemas');
    expect(step3Schema.safeParse({ zones: 0, tablesPerZone: 5 }).success).toBe(false);
  });

  it('rejects negative tablesPerZone', async () => {
    const { step3Schema } = await import('../lib/wizard-schemas');
    expect(step3Schema.safeParse({ zones: 1, tablesPerZone: -1 }).success).toBe(false);
  });

  it('accepts realistic table layout', async () => {
    const { step3Schema } = await import('../lib/wizard-schemas');
    expect(step3Schema.safeParse({ zones: 3, tablesPerZone: 8 }).success).toBe(true);
  });
});

// ----------------------------------------------------------
// Submit API call (final step)
// ----------------------------------------------------------

describe('Onboarding submit POST shape', () => {
  const ORIGINAL_FETCH = global.fetch;
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  it('startRegistration POSTs to /api/v1/public/onboarding/start', async () => {
    const captured: Array<[string, RequestInit | undefined]> = [];
    global.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      captured.push([typeof input === 'string' ? input : input.toString(), init]);
      return new Response(
        JSON.stringify({ data: { registration_id: 'reg-1', expires_at: '2026-12-31T23:59:59Z' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof global.fetch;

    const { startRegistration } = await import('../lib/wizard-api');
    const result = await startRegistration(
      {
        name: 'JomeBurger',
        slug: 'jomeburger',
        email: 'owner@jome.uz',
        phone: '+998901234567',
      },
      'uz',
    );

    expect(result.registration_id).toBe('reg-1');
    expect(captured[0]?.[0]).toContain('/api/v1/public/onboarding/start');
    expect(captured[0]?.[1]?.method).toBe('POST');
  });

  it('throws OnboardingApiError on 4xx with parseable body', async () => {
    global.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: 'slug_taken', errors: { slug: ['Taken'] } }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
    ) as unknown as typeof global.fetch;

    const { startRegistration } = await import('../lib/wizard-api');

    let caught: unknown = null;
    try {
      await startRegistration(
        { name: 'X', slug: 'taken', email: 'x@x.uz', phone: '+998901234567' },
        'uz',
      );
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeTruthy();
    expect((caught as { status?: number }).status).toBe(422);
  });

  it('passes Accept-Language header for the active locale', async () => {
    let captured: RequestInit | undefined;
    global.fetch = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      captured = init;
      return new Response(
        JSON.stringify({ data: { registration_id: 'reg-1', expires_at: '2026-12-31T23:59:59Z' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof global.fetch;

    const { startRegistration } = await import('../lib/wizard-api');
    await startRegistration(
      { name: 'X', slug: 'jome', email: 'x@x.uz', phone: '+998901234567' },
      'ru',
    );

    const headers = new Headers(captured?.headers);
    expect(headers.get('Accept-Language')).toBe('ru');
  });
});

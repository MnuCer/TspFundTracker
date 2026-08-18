import { describe, expect, it } from 'vitest';
import { getUserSettings } from './db';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

const missingUserId = 2_147_483_647;

function createContext(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: 'settings-regression-user',
      name: 'Settings Regression User',
      email: 'settings-regression@example.com',
      loginMethod: 'test',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('userSettings database boundary', () => {
  it('can read the userSettings table without throwing for a user with no saved row', async () => {
    const settings = await getUserSettings(missingUserId);

    expect(settings).toBeNull();
  });

  it('returns the documented defaults when the authenticated user has no saved settings', async () => {
    const caller = appRouter.createCaller(createContext(missingUserId));

    await expect(caller.settings.get()).resolves.toEqual({
      darkMode: 'auto',
      selectedFunds: 'G,C,S,I',
    });
  });
});

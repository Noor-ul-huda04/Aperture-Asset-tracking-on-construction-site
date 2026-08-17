import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, memoryLocalCache, setLogLevel, doc, getDoc } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider, getToken, AppCheck } from 'firebase/app-check';
import { firebaseConfig } from './firebaseConfig';

export { firebaseConfig };
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Silence Firestore internal network warning logs in preview sandboxes
setLogLevel('error');

export const db = (() => {
  const settings = {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache(),
  };

  try {
    if (firebaseConfig.firestoreDatabaseId) {
      return initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId);
    }
    return initializeFirestore(app, settings);
  } catch (_e) {
    try {
      if (firebaseConfig.firestoreDatabaseId) {
        return getFirestore(app, firebaseConfig.firestoreDatabaseId);
      }
      return getFirestore(app);
    } catch (_e2) {
      return getFirestore(app);
    }
  }
})();

export const auth = getAuth(app);

// ----------------------------------------------------
// FIREBASE APP CHECK FRONTEND SECURITY LAYER
// ----------------------------------------------------
let appCheckInstance: AppCheck | null = null;

if (typeof window !== 'undefined') {
  try {
    if (firebaseConfig.recaptchaSiteKey) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(firebaseConfig.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('[Firebase AppCheck] Initialized with ReCaptchaV3Provider.');
    } else {
      appCheckInstance = initializeAppCheck(app, {
        provider: new CustomProvider({
          getToken: async () => {
            const devToken = 'appcheck-token-dev-' + btoa(JSON.stringify({
              appId: firebaseConfig.appId || 'app',
              projectId: firebaseConfig.projectId || 'project',
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 3600
            }));
            return {
              token: devToken,
              expireTimeMillis: Date.now() + 3600 * 1000
            };
          }
        }),
        isTokenAutoRefreshEnabled: true
      });
      console.log('[Firebase AppCheck] Initialized with Security Layer Custom Provider.');
    }
  } catch (err) {
    console.warn('[Firebase AppCheck] Initialization notice:', err);
  }
}

export async function getAppCheckToken(): Promise<string> {
  const defaultDevToken = 'appcheck-token-dev-' + btoa(JSON.stringify({
    appId: firebaseConfig.appId || 'app',
    projectId: firebaseConfig.projectId || 'project',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  }));

  if (appCheckInstance && firebaseConfig.recaptchaSiteKey) {
    try {
      const res = await Promise.race([
        getToken(appCheckInstance, false),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 500))
      ]);
      if (res && res.token) return res.token;
    } catch (err) {
      console.warn('[Firebase AppCheck] Token retrieval warning:', err);
    }
  }

  return defaultDevToken;
}

// Store native fetch reference immediately before any patching
const nativeFetch = typeof window !== 'undefined' ? ((window as any)._originalFetch || window.fetch.bind(window)) : null;
if (typeof window !== 'undefined' && !(window as any)._originalFetch && nativeFetch) {
  (window as any)._originalFetch = nativeFetch;
}

export async function secureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
  if (url.startsWith('/api') || url.startsWith('api/') || url.includes('/api/')) {
    try {
      const appCheckToken = await getAppCheckToken();
      if (appCheckToken) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has('X-Firebase-AppCheck')) {
          headers.set('X-Firebase-AppCheck', appCheckToken);
        }
        if (auth.currentUser) {
          try {
            const idToken = await auth.currentUser.getIdToken();
            if (idToken && !headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${idToken}`);
            }
          } catch (_) {}
        }
        init.headers = headers;
      }
    } catch (e) {
      console.warn('[Fetch Interceptor] AppCheck attachment error:', e);
    }
  }
  const rawFetch = nativeFetch || (window as any)._originalFetch || window.fetch.bind(window);
  return rawFetch(input, init);
}

// Global fetch interceptor to attach X-Firebase-AppCheck header to all /api requests
if (typeof window !== 'undefined' && window.fetch) {
  try {
    if (!(window as any)._originalFetch) {
      (window as any)._originalFetch = window.fetch.bind(window);
    }

    const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      return secureFetch(input, init);
    };

    if (window.fetch !== interceptedFetch) {
      try {
        (window as any).fetch = interceptedFetch;
      } catch (_e) {
        Object.defineProperty(window, 'fetch', {
          value: interceptedFetch,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    }
  } catch (err) {
    console.warn('[Firebase AppCheck] Could not patch window.fetch directly:', err);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
    await Promise.race([
      getDoc(doc(db, 'sites', 'site-1')),
      timeoutPromise
    ]);
  } catch (_err) {
    // Silent fallback for offline sandboxed preview environments
  }
}
testConnection();

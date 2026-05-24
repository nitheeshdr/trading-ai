/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
/**
 * kiteconnect ships CJS-only; its TS types don't expose a constructor signature.
 * We use require() and cast to `any` so the rest of the codebase stays typed.
 */
const KiteConnectLib = require("kiteconnect");
const KC: new (opts: { api_key: string }) => any =
  KiteConnectLib.KiteConnect ?? KiteConnectLib.default ?? KiteConnectLib;

let kiteInstance: any = null;

export function getKiteClient(): any {
  if (!kiteInstance) {
    kiteInstance = new KC({ api_key: process.env.KITE_API_KEY! });
  }
  return kiteInstance;
}

export function getAuthorizedKiteClient(accessToken: string): any {
  const kite = getKiteClient();
  kite.setAccessToken(accessToken);
  return kite;
}

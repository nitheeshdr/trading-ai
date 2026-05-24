import KiteConnect from "kiteconnect";

let kiteInstance: InstanceType<typeof KiteConnect> | null = null;

export function getKiteClient(): InstanceType<typeof KiteConnect> {
  if (!kiteInstance) {
    kiteInstance = new KiteConnect({
      api_key: process.env.KITE_API_KEY!,
    });
  }
  return kiteInstance;
}

export function getAuthorizedKiteClient(accessToken: string): InstanceType<typeof KiteConnect> {
  const kite = getKiteClient();
  kite.setAccessToken(accessToken);
  return kite;
}

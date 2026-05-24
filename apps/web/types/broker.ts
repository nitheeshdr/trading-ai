export type BrokerName = "kite" | "upstox" | "angel" | "fyers";

export interface BrokerSession {
  userId: string;
  broker: BrokerName;
  accessToken: string;
  expiresAt: number;    // unix ms
}

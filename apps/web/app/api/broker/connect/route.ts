import { NextResponse } from "next/server";
import { getKiteClient } from "@/lib/kite/client";

export async function GET() {
  const kite = getKiteClient();
  const loginUrl = kite.getLoginURL();
  return NextResponse.redirect(loginUrl);
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}

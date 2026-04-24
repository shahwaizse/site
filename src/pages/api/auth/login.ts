import type { APIRoute } from "astro";
import { makeSessionCookie, verifyPassword } from "@/lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let password = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    password = String(form.get("password") ?? "");
  } else if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    password = String((body as any).password ?? "");
  } else if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    password = String(form.get("password") ?? "");
  }

  if (!verifyPassword(password)) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/dashboard/login?error=1" },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/dashboard",
      "Set-Cookie": makeSessionCookie(),
    },
  });
};

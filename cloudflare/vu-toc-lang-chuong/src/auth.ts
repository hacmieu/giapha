import { createRemoteJWKSet, jwtVerify } from "jose";

import { HttpError } from "./http";

export interface Actor {
  email: string;
  subject: string;
}

function accessIssuer(teamDomain: string): string {
  const withoutProtocol = teamDomain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  if (!withoutProtocol) {
    throw new HttpError(
      503,
      "access_not_configured",
      "Cloudflare Access chưa được cấu hình.",
    );
  }
  return `https://${withoutProtocol}`;
}

export async function requireAdmin(request: Request, env: Env): Promise<Actor> {
  if (env.DEPLOYMENT_MODE !== "admin" && env.DEPLOYMENT_MODE !== "local") {
    throw new HttpError(404, "not_found", "Không tìm thấy endpoint.");
  }

  if (env.DEPLOYMENT_MODE === "local") {
    return { email: "local-admin@localhost", subject: "local-development" };
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    throw new HttpError(401, "access_token_missing", "Thiếu Cloudflare Access JWT.");
  }

  const teamDomain = String(env.CF_ACCESS_TEAM_DOMAIN);
  const audience = String(env.CF_ACCESS_AUD).trim();
  if (!audience) {
    throw new HttpError(
      503,
      "access_not_configured",
      "Cloudflare Access audience chưa được cấu hình.",
    );
  }

  const issuer = accessIssuer(teamDomain);
  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  try {
    const result = await jwtVerify(token, jwks, {
      issuer,
      audience,
    });
    const email = result.payload.email;
    if (typeof email !== "string" || !email) {
      throw new HttpError(403, "access_email_missing", "JWT không có email hợp lệ.");
    }
    return {
      email,
      subject: result.payload.sub ?? "",
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "access_token_invalid", "Cloudflare Access JWT không hợp lệ.");
  }
}

import {
  createParentRelation,
  createPerson,
  createSpouseRelation,
  deletePerson,
  deleteRelation,
  updatePerson,
} from "./admin-api";
import { requireAdmin } from "./auth";
import { HttpError, assertSameOrigin, json } from "./http";
import {
  getPublicGraph,
  getPublicMedia,
  getPublicPerson,
  getPublicTree,
  searchPublicPeople,
} from "./public-api";

function routeParameter(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const value = pathname.slice(prefix.length);
  return value && !value.includes("/") ? value : null;
}

async function routeApi(
  request: Request,
  env: Env,
  requestId: string,
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET" && url.pathname === "/api/health") {
    const database = await env.DB.prepare("SELECT 1 AS healthy").first<{
      healthy: number;
    }>();
    return json({
      ok: database?.healthy === 1,
      mode: env.DEPLOYMENT_MODE,
      requestId,
    });
  }
  if (method === "GET" && url.pathname === "/api/public/tree") {
    return getPublicTree(env);
  }
  if (method === "GET" && url.pathname === "/api/public/graph") {
    return getPublicGraph(env);
  }
  if (method === "GET" && url.pathname === "/api/public/search") {
    return searchPublicPeople(env, url);
  }

  const publicPersonId = routeParameter(url.pathname, "/api/public/people/");
  if (method === "GET" && publicPersonId) {
    return getPublicPerson(env, publicPersonId);
  }
  const mediaKey = routeParameter(url.pathname, "/api/public/media/");
  if (method === "GET" && mediaKey) {
    return getPublicMedia(env, mediaKey);
  }

  if (!url.pathname.startsWith("/api/admin/")) {
    throw new HttpError(404, "not_found", "Không tìm thấy endpoint.");
  }
  assertSameOrigin(request);
  const actor = await requireAdmin(request, env);

  if (method === "POST" && url.pathname === "/api/admin/people") {
    return createPerson(request, env, actor, requestId);
  }
  const adminPersonId = routeParameter(url.pathname, "/api/admin/people/");
  if (method === "PATCH" && adminPersonId) {
    return updatePerson(request, env, actor, requestId, adminPersonId);
  }
  if (method === "DELETE" && adminPersonId) {
    return deletePerson(request, env, actor, requestId, adminPersonId);
  }
  if (method === "POST" && url.pathname === "/api/admin/parent-relations") {
    return createParentRelation(request, env, actor, requestId);
  }
  if (method === "POST" && url.pathname === "/api/admin/spouse-relations") {
    return createSpouseRelation(request, env, actor, requestId);
  }

  const parentRelationId = routeParameter(
    url.pathname,
    "/api/admin/parent-relations/",
  );
  if (method === "DELETE" && parentRelationId) {
    return deleteRelation(env, actor, requestId, "parent", parentRelationId);
  }
  const spouseRelationId = routeParameter(
    url.pathname,
    "/api/admin/spouse-relations/",
  );
  if (method === "DELETE" && spouseRelationId) {
    return deleteRelation(env, actor, requestId, "spouse", spouseRelationId);
  }

  throw new HttpError(404, "not_found", "Không tìm thấy endpoint.");
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
    try {
      const response = await routeApi(request, env, requestId);
      response.headers.set("x-request-id", requestId);
      response.headers.set("referrer-policy", "same-origin");
      response.headers.set("x-frame-options", "DENY");
      return response;
    } catch (error) {
      if (error instanceof HttpError) {
        return json(
          {
            error: {
              code: error.code,
              message: error.message,
              requestId,
            },
          },
          { status: error.status },
        );
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          event: "unhandled_request_error",
          requestId,
          method: request.method,
          path: url.pathname,
          message,
        }),
      );
      const status = message.includes("UNIQUE constraint failed") ? 409 : 500;
      return json(
        {
          error: {
            code: status === 409 ? "duplicate_record" : "internal_error",
            message:
              status === 409
                ? "Dữ liệu đã tồn tại."
                : "Có lỗi nội bộ; không có thay đổi nào được xác nhận.",
            requestId,
          },
        },
        { status },
      );
    }
  },
} satisfies ExportedHandler<Env>;

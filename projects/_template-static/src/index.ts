import { withSecurityHeaders } from "./kit";

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const res = await env.ASSETS.fetch(request);
    return withSecurityHeaders(res);
  },
};

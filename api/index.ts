export default async function handler(req: any, res: any) {
  // @ts-expect-error The API bundle is generated as an .mjs runtime artifact.
  const { default: app } = await import("../artifacts/api-server/dist/app.mjs");
  return app(req, res);
}

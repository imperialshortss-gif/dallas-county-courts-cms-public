export default async function handler(req: any, res: any) {
  // @ts-ignore Generated .mjs bundle has no separate TypeScript declaration.
  const { default: app } = await import("../artifacts/api-server/dist/app.mjs");
  return app(req, res);
}

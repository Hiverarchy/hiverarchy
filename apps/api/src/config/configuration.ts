export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  media: {
    uploadRoot: process.env.MEDIA_UPLOAD_ROOT ?? 'uploads',
    /** URL path prefix (served by Nest static, not under /api) */
    publicPath: '/media',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  },
  surreal: {
    // Default: local Surreal (e.g. `surreal start ... --bind 0.0.0.0:8818`) alongside other apps in separate namespaces.
    url: process.env.SURREAL_URL ?? 'http://127.0.0.1:8818/rpc',
    user: process.env.SURREAL_USER ?? 'root',
    pass: process.env.SURREAL_PASS ?? 'root',
    ns: process.env.SURREAL_NS ?? 'hiverarchy',
    db: process.env.SURREAL_DB ?? 'main',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-only-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
});

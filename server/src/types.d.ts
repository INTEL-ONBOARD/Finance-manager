import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    // Populated by the auth guard from the verified JWT. Never trust client input.
    userId: string
    sessionId: string
  }
}

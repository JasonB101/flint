const Sentry = require("@sentry/node")
const { nodeProfilingIntegration } = require("@sentry/profiling-node")

Sentry.init({
  dsn: "https://40a739efd4a7f0d78141320bf2707252@o4508703040798720.ingest.us.sentry.io/4508703040929792",
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})

module.exports = Sentry
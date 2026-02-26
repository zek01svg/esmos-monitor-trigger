import logger from "../lib/pino";
import initSentry from "../lib/sentry";
import dotenv from "dotenv";
dotenv.config();

export async function checkSiteStatus(): Promise<boolean> {
  if (!process.env.ESMOS_URL) {
    logger.error("ESMOS_URL is not defined in environment variables");
    return false;
  }

  logger.info(`Checking site status for ${process.env.ESMOS_URL}...`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(process.env.ESMOS_URL!, {
      signal: controller.signal
    })

    if (res.ok) {
      logger.info(`Site is reachable with status code ${res.status}`)
      return true
    }
    logger.info(`Site is not reachable with status code ${res.status}`)
    return false
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch page keywords or request timed out')
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}
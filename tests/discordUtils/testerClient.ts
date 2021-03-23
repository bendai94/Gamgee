import Discord from "discord.js";
import requireEnv from "../requireEnv";
import { useTestLogger } from "../testUtils/logger";

const logger = useTestLogger();

let isClientLoggedIn = false;
const client = new Discord.Client();

/**
 * A collection of functions that expect a message to arrive within a
 * predefined timeout. When a message arrives in any channel accessible
 * by the tester bot, all of these functions are called. Those that
 * return `true` will be removed from the collection.
 *
 * Waiter functions should remove themselves from this collection if their
 * timeout elapses before a matching message arrives.
 */
export const messageWaiters = new Discord.Collection<number, (msg: Discord.Message) => boolean>();

client.on("message", message => {
  if (messageWaiters.size === 0) return;

  const removed = messageWaiters.sweep((waiter, id) => {
    const shouldRemove = waiter(message);
    if (shouldRemove) {
      logger.debug(`Waiter ${id} handled a message. Removing from the loop...`);
    } else {
      logger.debug(`Waiter ${id} did not handle the message. Keeping in the loop.`);
    }
    return shouldRemove;
  });
  logger.debug(`Removed ${removed} finished waiters.`);
});

/**
 * Prepares the tester bot's Discord client. If the client is not logged in,
 * then we log it in before we return.
 *
 * @returns the logged-in Discord client for the tester bot.
 */
export async function testerClient(): Promise<Discord.Client> {
  const TESTER_TOKEN = requireEnv("CORDE_TEST_TOKEN");
  if (!isClientLoggedIn) {
    await client.login(TESTER_TOKEN);
    isClientLoggedIn = true;
  }
  return client;
}

/**
 * Logs out of the tester bot's Discord client.
 */
export function logOut(): void {
  if (isClientLoggedIn) {
    client.destroy();
  }
}
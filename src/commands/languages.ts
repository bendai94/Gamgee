import type { GitHubMetadata } from "../helpers/githubMetadata";
import type { GlobalCommand } from "./Command";
import { gitHubMetadata } from "../helpers/githubMetadata";
import richErrorMessage from "../helpers/richErrorMessage";

let cachedMetadata: GitHubMetadata | null | "waiting" = null;

const languages: GlobalCommand = {
	name: "languages",
	description: "Print my core repository's language statistics.",
	requiresGuild: false,
	async execute({ logger, prepareForLongRunningTasks, reply }) {
		const owner = "AverageHelper";
		const repo = "Gamgee";

		if (cachedMetadata === "waiting") {
			return reply("working on it...");
		}

		if (cachedMetadata === null) {
			try {
				cachedMetadata = "waiting";
				await prepareForLongRunningTasks();

				// eslint-disable-next-line require-atomic-updates
				cachedMetadata = await gitHubMetadata({ owner, repo });
			} catch (error: unknown) {
				logger.error(richErrorMessage("Failed to get metadata from my GitHub repo.", error));
				return reply("Erm... I'm not sure :sweat_smile:");
			}
		}

		const languages = cachedMetadata.languages;
		logger.debug(`Language metadata: ${JSON.stringify(languages, null, "  ")}`);
		if (languages === undefined) {
			return reply("I'm really not sure. Ask my boss that.");
		}

		const totalLanguages = Object.keys(languages).length;
		if (totalLanguages > 3) {
			// Lots of languages. Be vague.
			return reply(
				`I'm made up of about ${totalLanguages} different languages, each one of them perfect and unique.`
			);
		}

		let totalUse = 0;
		Object.values(languages).forEach(val => {
			totalUse += val ?? 0;
		});

		const stats = Object.entries(languages).map(([languageName, languageUse]) => {
			const use = (languageUse ?? 0) / totalUse;
			return `${languageName} (${(use * 100).toFixed(1)}%)`;
		});

		logger.debug(`Gamgee is made of ${totalLanguages} languages: ${stats.join(", ")}`);

		const last = stats.splice(-1)[0] ?? "a secret language only I know the meaning of";
		if (totalLanguages > 2) {
			return reply(`I'm made of ${stats.join(", ")}, and ${last}.`);
		} else if (totalLanguages > 1) {
			return reply(`I'm made of ${stats.join(", ")} and ${last}. :blush:`);
		}
		return reply(`I'm made of ${last}. :blush:`);
	}
};

export default languages;

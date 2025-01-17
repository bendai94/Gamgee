import type { Subcommand } from "../Command";
import { useQueueStorage } from "../../useQueueStorage";
import { getConfigCommandPrefix } from "../../actions/config/getConfigValue";
import { resolveUserFromOption } from "../../helpers/optionResolvers";
import getQueueChannel from "../../actions/queue/getQueueChannel";
import logUser from "../../helpers/logUser";
import parentCommand from "../songRequest";
import StringBuilder from "../../helpers/StringBuilder";
import whitelist from "./whitelist";

const blacklist: Subcommand = {
	name: "blacklist",
	description: "Show the list of blacklisted users, or add a user to the blacklist.",
	options: [
		{
			name: "user",
			description: "Block the user from making song requests",
			type: "USER",
			required: false
		}
	],
	type: "SUB_COMMAND",
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute(context) {
		const {
			guild,
			user,
			options,
			storage,
			logger,
			reply,
			replyPrivately,
			deleteInvocation
		} = context;

		const queueChannel = await getQueueChannel(guild);
		if (!queueChannel) {
			return reply({ content: ":x: There's no queue set up yet.", ephemeral: true });
		}

		const queue = useQueueStorage(queueChannel);

		const firstOption = options.data[0];
		if (!firstOption) {
			if (context.type === "message") {
				logger.debug("Private-ness for message commands is restricted to DMs.");
				// We can reply to text messages twice, since the second one will be a DM. We `await` here, not `return`.
				await reply(":paperclip: Check the list in your DMs");
			}

			const queueConfig = await queue.getConfig();
			const blacklistedUsers = queueConfig.blacklistedUsers.map(user => user.id);

			const prefix = await getConfigCommandPrefix(storage);
			const guildName = guild.name.trim();

			const replyBuilder = new StringBuilder();

			replyBuilder.push(`**Song Request Blacklist for *${guildName}***`);
			replyBuilder.pushNewLine();
			if (blacklistedUsers.length === 0) {
				replyBuilder.push(" - Nobody. (Let's hope it remains this way.)");
				replyBuilder.pushNewLine();
			}

			blacklistedUsers.forEach(userId => {
				replyBuilder.push(` - <@${userId}>`);
				replyBuilder.pushNewLine();
			});

			replyBuilder.pushNewLine();
			replyBuilder.push("To add a user to the blacklist, run ");
			replyBuilder.pushCode(`${prefix}${parentCommand.name} ${blacklist.name} <user mention>`);
			replyBuilder.push(".");

			replyBuilder.pushNewLine();
			replyBuilder.push("To remove a user from the blacklist, run ");
			replyBuilder.pushCode(`${prefix}${parentCommand.name} ${whitelist.name} <user mention>`);
			replyBuilder.push(".");
			replyBuilder.pushNewLine();
			if (context.type === "message") {
				// These are DMs. Be clear about where to run commands.
				replyBuilder.push("(Run these in ");
				replyBuilder.push(`*${guildName}*`);
				replyBuilder.push(", obviously)");
			}

			return replyPrivately(replyBuilder.result());
		}

		await deleteInvocation();

		const subject = await resolveUserFromOption(firstOption, guild);
		if (!subject) {
			return reply({ content: ":x: I don't know who that is.", ephemeral: true });
		}

		if (subject.id === user.id) {
			return reply({ content: ":x: You can't blacklist yourself, silly!", ephemeral: true });
		}

		if (subject.id === guild.ownerId) {
			return reply({
				content: ":x: I can't blacklist the owner. That would be rude!",
				ephemeral: true
			});
		}

		await queue.blacklistUser(subject.id);
		logger.info(`Removed song request permission from user ${logUser(subject)}.`);

		return reply({
			content: `:pirate_flag: <@!${subject.id}> is no longer allowed to submit song requests.`,
			shouldMention: false,
			ephemeral: true
		});
	}
};

export default blacklist;

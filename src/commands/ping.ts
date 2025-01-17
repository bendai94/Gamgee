import type Discord from "discord.js";
import type { Command } from "./Command";
import { randomPhrase } from "../helpers/randomStrings";

const ping: Command = {
	name: "ping",
	description: "Ping my host server to check latency.",
	requiresGuild: false,
	async execute(context) {
		const { client, user, logger } = context;
		const random = randomPhrase().unwrapFirstWith({
			me: client.user?.username ?? "Me",
			otherUser: user,
			otherMember: null
		});

		let testMessage: Discord.Message;
		let responseTime: number;

		// FIXME: Ping seems to report slower for messages vs interactions
		// This is probably to do with the extra API work we do around message parsing. Best fix that
		if (context.type === "message") {
			testMessage = await context.message.reply(random);
			responseTime = testMessage.createdTimestamp - context.message.createdTimestamp;
		} else {
			await context.interaction.reply(random);
			testMessage = (await context.interaction.fetchReply()) as Discord.Message;
			responseTime = testMessage.createdTimestamp - context.interaction.createdTimestamp;
		}

		const apiLatency = Math.round(client.ws.ping);
		await testMessage.edit(
			`Pong! Sent response in \`${responseTime}ms\`. API latency is \`${apiLatency}ms\``
		);
		logger.info(`Sent ping response in ${responseTime}ms. API latency is ${apiLatency}ms.`);
	}
};

export default ping;

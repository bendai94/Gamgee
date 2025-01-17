import type { Command } from "./Command";
import Discord from "discord.js";

export * from "./Command";

import config from "./config";
import help from "./help";
import howto from "./howto";
import languages from "./languages";
import limits from "./limits";
import nowPlaying from "./nowPlaying";
import ping from "./ping";
import queue from "./queue";
import songRequest from "./songRequest";
import test from "./test";
import typeHere from "./type";
import version from "./version";
import video from "./video";

export const allCommands = new Discord.Collection<string, Command>();

/**
 * Finds the name of the command referenced by the given alias.
 *
 * Returns the provided `alias` if no match is found. The caller
 * should check that the result is an actual command name.
 */
export function resolveAlias(alias: string): string {
	for (const [name, command] of allCommands) {
		const aliases = command.aliases ?? [];
		if (aliases.includes(alias)) {
			return name;
		}
	}
	return alias;
}

function add(command: Command): void {
	if (allCommands.has(command.name)) {
		throw new TypeError(
			`Failed to add command ${command.name} when a command with that name was already added`
		);
	}
	// TODO: Check that command aliases are as unique as command names
	allCommands.set(command.name, command);
}

add(config);
add(help);
add(howto);
add(languages);
add(limits);
add(nowPlaying);
add(ping);
add(queue);
add(songRequest);
add(test);
add(typeHere);
add(version);
add(video);

import colors from "colors";
import path from "path";
import { fileURLToPath } from 'url';
import { log, error } from "../../utils/logging.js";
import { client } from "../../index.js";
import { readdirSync, statSync } from "fs";

import { convertURLs } from "../../utils/windowsUrlConvertor.js";
import { loadEmojis } from "../../utils/loadEmoji.js";
import { DatabaseMiddleware } from "../../core/databaseMiddleware.js";

interface Command {
	name: string;
	description: string;
	options: any[]; // You can replace "any" with the correct type for options
	contexts: any[];
};


export default {
	name: "ready",
	description: "client ready event",
	once: false,
	function: async function () {
		log(`Logged in as ${colors.red(client.user!.tag)}`);

		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);

		const commands: Command[] = [];
		const registerDir = async (dirName: string) => {
			const COMMAND_DIR = path.resolve(__dirname, `../../${dirName}`);
			const readDir = async (dir: string) => {
				const files = readdirSync(dir);
				for await (const file of files) {
					if (statSync(`${dir}/${file}`).isDirectory()) await readDir(`${dir}/${file}`);
					else {
						const fileToImport = process.platform === "win32" ? `${convertURLs(dir)}/${file}` : `${dir}/${file}`;
						const command = (await import(fileToImport)).default;
						if (command.isSubCommand && !command.isConfig) continue; // Skip subcommands that are not configs
						if (command?.name) {
							commands.push({
								name: command.name,
								description: command.description,
								options: command.options,
								contexts: command?.contexts || [],

							});
							log(`${dir}/${file} has been registered!`);
						} else {
							error(`${dir}/${file} has no name!`);
						}
					}
				}
			};
			await readDir(COMMAND_DIR);
		};

		await registerDir("slashCommands");




		client.application.commands.set(commands).then(() => {
			log(`Registered ${commands.length} slash commands.`);
		}).catch((err) => {
			error(`Failed to register slash commands: ${err}`);
		});

		await loadEmojis(client);
		await DatabaseMiddleware.getAllGuildConfigs();


	},
} as any;

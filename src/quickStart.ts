import type FloatplaneApi from "floatplane";
import type { PlexSettings, Settings } from "./lib/types";

import * as prompts from "./lib/prompts"

import { defaultResoulutions } from "./lib/defaults";

import { loginFloatplane, loginPlex } from "./logins"
import { findClosestEdge } from "./lib/helpers";

export const promptPlexSections = async (plexSettings: PlexSettings) => {
	plexSettings.sectionsToUpdate = (await prompts.plex.sections(plexSettings.sectionsToUpdate.join(", ")));
	plexSettings.sectionsToUpdate.splice(plexSettings.sectionsToUpdate.indexOf(""), 1);
	if (plexSettings.sectionsToUpdate.length === 0) {
		console.log("You didnt specify any plex sections to update! Disabling plex integration...\n");
		plexSettings.enabled = false;
		return false;
	}
};

export const quickStart = async (settings: Settings, fApi: FloatplaneApi) => {
	console.log("Welcome to Floatplane Downloader! Thanks for checking it out <3.");
	console.log("According to your settings.json this is your first launch! So lets go through the basic setup...\n");
	console.log("\n== General ==\n");

	settings.videoFolder = await prompts.settings.videoFolder(settings.videoFolder);
	settings.floatplane.videosToSearch = await prompts.floatplane.videosToSearch(settings.floatplane.videosToSearch);
	settings.downloadThreads = await prompts.settings.downloadThreads(settings.downloadThreads);
	settings.floatplane.videoResolution = await prompts.settings.videoResolution(settings.floatplane.videoResolution, defaultResoulutions);
	settings.fileFormatting = await prompts.settings.fileFormatting(settings.fileFormatting, settings._fileFormattingOPTIONS);

	const extras = await prompts.settings.extras(settings.extras);
	for (const extra in settings.extras) settings.extras[extra] = extras.indexOf(extra) > -1?true:false;

	settings.repeat.enabled = await prompts.settings.repeat(settings.repeat.enabled);
	if (settings.repeat.enabled) settings.repeat.interval = await prompts.settings.repeatInterval(settings.repeat.interval);

	console.log("\n== Floatplane ==\n");
	console.log("Next we are going to login to floatplane...");
	await loginFloatplane(fApi);

	// Prompt to find best edge server for downloading
	if (await prompts.findClosestServerNow()) settings.floatplane.edge = findClosestEdge(await fApi.api.edges()).hostname;
	console.log(`Closest edge server found is: "${settings.floatplane.edge}"\n`);

	// Prompt & Set auto finding best edge server
	settings.floatplane.findClosestEdge = await prompts.settings.autoFindClosestServer(settings.floatplane.findClosestEdge);

	console.log("\n== Plex ==\n");
	settings.plex.enabled = await prompts.plex.usePlex(settings.plex.enabled);
	if (settings.plex.enabled) {
		if (await promptPlexSections(settings.plex)) {
			settings.plex.token = await loginPlex(settings.plex.hostname, settings.plex.port);
			settings.plex.hostname = await prompts.plex.hostname(settings.plex.hostname);
			settings.plex.port = await prompts.plex.port(settings.plex.port);
		}
	}
	console.log("\n== All Setup! ==\n");
}
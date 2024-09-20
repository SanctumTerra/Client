import type { Client } from "../Client";
import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "../vendor/Logger";

class ProtocolValidator {
	private client: Client;
	private readonly VERSIONS: Record<string, string> = {
		"1.21.20": "0.4.4",
	};

	constructor(client: Client) {
		this.client = client;
	}

	async validateAndCheck(): Promise<void> {
		Logger.info("Validating protocol version...");
		const currentVersion = await this.getCurrentProtocolVersion();
		const requiredVersion = this.getRequiredProtocolVersion();

		if (!requiredVersion) {
			Logger.error(
				`Unsupported Minecraft version: ${this.client.options.version}`,
			);
			process.exit(1);
		}

		if (currentVersion !== requiredVersion) {
			Logger.error(
				`Protocol version mismatch. Required: ${requiredVersion}, Current: ${currentVersion}`,
			);
			process.exit(1);
		}

		Logger.info(`Protocol version check passed. Version: ${currentVersion}`);
	}

	private async getCurrentProtocolVersion(): Promise<string | null> {
		return this.getVersionFromPackageJson();
	}

	private async getVersionFromPackageJson(): Promise<string | null> {
		try {
			const packageJsonPath = path.join(process.cwd(), "package.json");
			const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
			const packageJson = JSON.parse(packageJsonContent);
			return (
				packageJson.dependencies["@serenityjs/protocol"] ||
				packageJson.devDependencies["@serenityjs/protocol"] ||
				null
			);
		} catch (error) {
			Logger.error("Package not found in package.json");
			return null;
		}
	}

	private getRequiredProtocolVersion(): string | undefined {
		return this.VERSIONS[this.client.options.version];
	}
}

export { ProtocolValidator };

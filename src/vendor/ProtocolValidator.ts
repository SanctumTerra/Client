import { Client } from "../Client";
import semver from 'semver';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class ProtocolValidator {
    private client: Client;
    private readonly VERSIONS: Record<string, string> = {
        "1.21.20": "0.4.2",
    };

    constructor(client: Client) {
        this.client = client;
    }

    async validateAndInstall(): Promise<void> {
        const currentVersion = await this.getCurrentProtocolVersion();
        const requiredVersion = this.getRequiredProtocolVersion();

        if (!requiredVersion) {
            throw new Error(`Unsupported Minecraft version: ${this.client.options.version}`);
        }

        if (!currentVersion || !semver.satisfies(currentVersion, requiredVersion)) {
            await this.installProtocol(requiredVersion);
        }
    }

    private async getCurrentProtocolVersion(): Promise<string | null> {
        try {
            const { stdout } = await execAsync('npm list @serenityjs/protocol --json');
            const packageInfo = JSON.parse(stdout);
            return packageInfo.dependencies['@serenityjs/protocol'].version;
        } catch (error) {
            console.error('Error getting current @serenityjs/protocol version:', error);
            return null;
        }
    }

    private getRequiredProtocolVersion(): string | undefined {
        return this.VERSIONS[this.client.options.version];
    }

    private async installProtocol(version: string): Promise<void> {
        try {
            console.log(`Installing @serenityjs/protocol@${version}...`);
            await execAsync(`npm install @serenityjs/protocol@${version}`);
            console.log('Installation complete.');
        } catch (error) {
            console.error('Error installing @serenityjs/protocol:', error);
            throw new Error('Failed to install required @serenityjs/protocol version');
        }
    }
}

export { ProtocolValidator };
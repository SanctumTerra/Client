import { Client } from "src/Client";
import { join } from "path";
import { access, mkdir, readFile, writeFile } from "fs/promises";
import { readdirSync, statSync } from "fs";
import { Logger } from "./Logger";
import { exec } from "child_process";
import { promisify } from "util";

interface PluginInfo {
    name: string;
    main: string;
    author: string;
    description: string;
    version: string;
}

export class PluginLoader {
    private path: string;

    constructor(private client: Client) {
        this.path = join(process.cwd(), "plugins");
    }

    public async init(): Promise<void> {
        await this.checkFolder();
        await this.loadPlugins();
    }

    private async checkFolder(): Promise<void> {
        try {
            await access(this.path);
        } catch {
            await mkdir(this.path, { recursive: true });
        }
    }

    private async getPluginFolders(): Promise<string[]> {
        const items = readdirSync(this.path);
        return items.filter(async (item) => {
            const itemPath = join(this.path, item);
            if (!statSync(itemPath).isDirectory()) return false;
            try {
                const packageJson = JSON.parse(await readFile(join(itemPath, 'package.json'), 'utf-8'));
                const { plugin } = packageJson;
                return plugin && plugin.name && plugin.main && plugin.author && plugin.description && plugin.version;
            } catch {
                Logger.info(`§cInvalid plugin configuration in ${item}/package.json`);
                return false;
            }
        });
    }

    private getPluginClass(mainPath: string): any {
        const PluginModule = require(mainPath);
        if (typeof PluginModule.default === 'function') return PluginModule.default;
        if (typeof PluginModule === 'function') return PluginModule;
        throw new Error('Plugin does not export a valid class');
    }

    private async installDependencies(pluginPath: string): Promise<void> {
        const packageJsonPath = join(pluginPath, 'package.json');
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
        
        if (!packageJson.dependencies?.['@sanctumterra/client']) {
            packageJson.dependencies = { ...packageJson.dependencies, '@sanctumterra/client': '*' };
            await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
            Logger.info(`§3Added @sanctumterra/client to dependencies for plugin in ${pluginPath}`);
        }

        const nodeModulesPath = join(pluginPath, 'node_modules');
        if (await access(nodeModulesPath).catch(() => true)) {
            Logger.info(`§3Installing dependencies for plugin in ${pluginPath}...`);
            try {
                await promisify(exec)('npm install', { cwd: pluginPath });
                Logger.info(`§aSuccessfully installed dependencies for plugin in ${pluginPath}`);
            } catch (error) {
                Logger.info(`§cFailed to install dependencies for plugin in ${pluginPath}: ${(error as Error).message}`);
                throw error;
            }
        } else {
            Logger.info(`§aDependencies already installed for plugin in ${pluginPath}`);
        }
    }

    public async loadPlugins(): Promise<void> {
        const pluginFolders = await this.getPluginFolders();
        Logger.info("§3Loading Plugins!");
        
        if (pluginFolders.length === 0) {
            Logger.info("§3No valid plugins found.");
            return;
        }

        for (const pluginFolder of pluginFolders) {
            const pluginPath = join(this.path, pluginFolder);
            try {
                const packageJson = JSON.parse(await readFile(join(pluginPath, 'package.json'), 'utf-8'));
                const pluginInfo: PluginInfo = packageJson.plugin;

                await this.installDependencies(pluginPath);

                const PluginClass = this.getPluginClass(join(pluginPath, pluginInfo.main));
                const plugin = new PluginClass(this.client);

                if (typeof plugin.onLoad === 'function') {
                    await plugin.onLoad(this.client);
                }

                Logger.info(`§3Loaded plugin: ${pluginInfo.name} v${pluginInfo.version}`);
            } catch (error) {
                Logger.info(`§cFailed to load plugin ${pluginFolder}: ${(error as Error).message}`);
                if ((error as Error).message.includes('Cannot find module')) {
                    Logger.info(`§3Make sure all dependencies are correctly listed in ${pluginFolder}/package.json`);
                }
            }
        }
    }
}
class Logger {
    constructor() {}

    static info(...data: any[]) {
        this.log('§7<§l§bINFO§7>§r', ...data);
    }
    static error(...data: any[]) {
        this.log('§7<§l§cERROR§7>§r', ...data);
    }
    static chat(...data: any[]): void {
        this.log('§7<§l§aCHAT§7>§r', ...data);
    }

    static date(): string {
        const date = new Date();
        return this.colorize(`§7<§f${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}§7>§r:`)[0];
    }

    static log(...data: any[]) {
        console.log(this.date(), ...this.colorize(...data));
    }

    static colorize(...args: any[]): string[] {
        const colors: { [key: string]: string } = {
            "0": "\u001B[30m", // Black
            "1": "\u001B[34m", // Dark Blue
            "2": "\u001B[32m", // Dark Green
            "3": "\u001B[36m", // Dark Aqua
            "4": "\u001B[31m", // Dark Red
            "5": "\u001B[35m", // Dark Purple
            "6": "\u001B[33m", // Gold
            "7": "\u001B[30m", // Gray
            "8": "\u001B[90m", // Dark Gray
            "9": "\u001B[94m", // Blue
            a: "\u001B[92m", // Green
            b: "\u001B[96m", // Aqua
            c: "\u001B[91m", // Red
            d: "\u001B[95m", // Light Purple
            e: "\u001B[93m", // Yellow
            f: "\u001B[97m", // White
            r: "\u001B[0m", // Reset
            l: "\u001B[1m", // Bold
        };

        const regex = /§[\da-fklr]/g;

        return args.map(arg => {
            if (typeof arg !== 'string') return arg;
            return arg.replace(regex, match => {
                const color = colors[match[1]];
                return color || match;
            });
        });
    }
}

export { Logger };
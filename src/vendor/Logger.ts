type LogData = string | number | boolean | null | undefined | object;

const colors: { [key: string]: string } = {
	"0": "\u001B[30m",
	"1": "\u001B[34m",
	"2": "\u001B[32m",
	"3": "\u001B[36m",
	"4": "\u001B[31m",
	"5": "\u001B[35m",
	"6": "\u001B[33m",
	"7": "\u001B[37m",
	"8": "\u001B[90m",
	"9": "\u001B[94m",
	a: "\u001B[92m",
	b: "\u001B[96m",
	c: "\u001B[91m",
	d: "\u001B[95m",
	e: "\u001B[93m",
	f: "\u001B[97m",
	g: "\u001B[38;5;221m",
	h: "\u001B[38;5;224m",
	i: "\u001B[38;5;251m",
	j: "\u001B[38;5;237m",
	m: "\u001B[38;5;124m",
	n: "\u001B[38;5;173m",
	p: "\u001B[38;5;221m",
	q: "\u001B[38;5;71m",
	s: "\u001B[38;5;37m",
	t: "\u001B[38;5;25m",
	u: "\u001B[38;5;140m",
	r: "\u001B[0m",
};

const specialFormatting: { [key: string]: string } = {
	l: "\u001B[1m",
	o: "\u001B[3m",
	k: "\u001B[5m",
};

const Logger = {
	info(...data: LogData[]): void {
		this.log("§7<§l§bINFO§7>§r", ...data);
	},

	error(...data: LogData[]): void {
		this.log("§7<§l§cERROR§7>§r", ...data);
	},

	chat(...data: LogData[]): void {
		this.log("§7<§l§aCHAT§7>§r", ...data);
	},

	debug(...data: LogData[]): void {
		this.log("§7<§l§dDEBUG§7>§r", ...data);
	},

	warn(...data: LogData[]): void {
		this.log("§7<§l§eWARN§7>§r", ...data);
	},

	date(): string {
		const date = new Date();
		return this.colorize(
			`§7<§f${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}§7>§r:`,
		)[0] as string;
	},

	log(...data: LogData[]): void {
		console.log(this.date(), ...this.colorize(...data));
	},

	colorize(...args: LogData[]): (string | LogData)[] {
		const regex = /§[0-9a-zA-Z]/g;

		return args.map((arg) => {
			if (typeof arg !== "string") return arg;
			let result = "";
			let lastIndex = 0;
			let currentColor = "";
			let currentFormat = "";

			arg.replace(regex, (match, index) => {
				const code = match[1].toLowerCase();
				result +=
					arg.slice(lastIndex, index) +
					(colors[code] || specialFormatting[code] || "");

				if (colors[code]) {
					currentColor = colors[code];
					currentFormat = "";
				} else if (specialFormatting[code]) {
					currentFormat += specialFormatting[code];
				} else if (code === "r") {
					currentColor = "";
					currentFormat = "";
				}

				lastIndex = index + 2;
				return "";
			});

			result += arg.slice(lastIndex);
			return result + colors.r;
		});
	},
};

export { Logger };

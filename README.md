# @sanctumterra/client

A powerful and flexible bot client for Minecraft: Bedrock Edition.

## Features

- Easy-to-use API for creating Minecraft: Bedrock Edition bots
- Support for multiple protocol versions
- Built on top of robust libraries like bedrock-protocol and serenity

## Installation

Install the package using npm:

```bash
npm install @sanctumterra/client
```

## Version Support

| Client Version | Minecraft: Bedrock Edition Version |
|----------------|-----------------------------------|
| 1.0.19         | 1.21.2                            |

## Quick Start

```typescript
import { Client, Logger } from "@sanctumterra/client";

const bot = new Client({
  host: 'localhost',
  port: 19132,
  username: 'MyBot'
});

bot.on('spawn', () => {
  Logger.info('Bot has spawned in the world!');
});

bot.connect();
```

## Documentation

For detailed documentation and API reference, please visit our [documentation site](https://docs.sanctumterra.com).

## Examples

Check out the `examples` folder in this repository for sample bot scripts and usage patterns.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details on how to get started.

## Credits

This project wouldn't be possible without the amazing work of:

- [PrismarineJS](https://github.com/PrismarineJS) - For their authentication examples and library
- [SerenityJS](https://github.com/SerenityJS) - For their Minecraft: Bedrock Edition protocol implementation
- [PMK744](https://github.com/PMK744) - Lead developer of SerenityJS

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on our [GitHub repository](https://github.com/sanctumterra/client/issues).

---

Made with ❤️ by the SanctumTerra team
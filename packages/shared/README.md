<div align="center">
  <img width="1000" alt="image" src="https://github.com/caido-community/.github/blob/main/content/banner.png?raw=true">

  <br />
  <br />
  <a href="https://github.com/caido-community" target="_blank">Github</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://developer.caido.io/" target="_blank">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://links.caido.io/www-discord" target="_blank">Discord</a>
  <br />
  <hr />
</div>

# Autorize

Type definitions and API specification for the [Autorize](https://github.com/caido-community/autorize) plugin.

This package is used by the `@caido/sdk-client` to provide fully typed access to the Autorize plugin API, enabling automated authorization testing workflows from scripts, CI/CD pipelines, and external tools.

```typescript
import { Client } from "@caido/sdk-client";
import type { Spec } from "@caido-community/autorize";

const client = new Client({ url: "http://localhost:8080", auth: { pat } });
await client.connect();

const autorize = await client.plugin.pluginPackage<Spec>("autorize");
const templates = await autorize.getTemplates();
```

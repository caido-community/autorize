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

Automated authorization testing for web applications. Autorize helps you find authorization vulnerabilities by automatically testing if lower-privilege users can access resources they shouldn't.

<img width="1902" height="1040" alt="dashboard" src="https://github.com/user-attachments/assets/d62d3ac5-56e8-45f6-b884-8992fd164e57" />

## Installation

### From Plugin Store

1. Install via the Caido Plugin Store
2. Navigate to the Autorize page from the sidebar
3. Configure your mutations and enable passive scanning

### Manual Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the plugin:

   ```bash
   pnpm build
   ```

3. Install in Caido:
   - Upload the `dist/plugin_package.zip` file by clicking "Install Package" in Caido's plugin settings

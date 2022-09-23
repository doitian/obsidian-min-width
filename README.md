# Obsidian Min Width Plugin

## What This Plugin Does?

The Min Width plugin sets the minimum width for the active pane. Obsidian will auto resize the active pane to ensure it is wider enough and shrink other panes accordingly.

This plugin is based on the blog post [_Set the Minimum Width of the Active Pane in Obsidian_](https://blog.iany.me/2022/09/set-the-minimum-width-of-the-active-pane-in-obsidian/).

[![](https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/5569408d-3300-4b5c-b4b8-6e8baa5ad413.gif?ClientID=vimeo-core-prod&Date=1663953976&Signature=3840517f68f618fa3b48788f5cc5c1579d95b46b)](https://vimeo.com/752964835)

## How to Use

### Manually installing the plugin

- Copy over `main.js`, `manifest.json` in the release to your vault `VaultFolder/.obsidian/plugins/obsidian-min-width/`.

## Contribute

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

### Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

### How to use

- Clone this repo into your vault as `VaultFolder/.obsidian/plugins/obsidian-min-width`.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

### Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`


### API Documentation

See https://github.com/obsidianmd/obsidian-api

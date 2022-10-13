# Obsidian Min Width Plugin

## What This Plugin Does?

The Min Width plugin sets the minimum width for the active pane. Obsidian will auto resize the active pane to ensure it is wider enough and shrink other panes accordingly.

This plugin is based on the blog post [_Set the Minimum Width of the Active Pane in Obsidian_](https://blog.iany.me/2022/09/set-the-minimum-width-of-the-active-pane-in-obsidian/).

[![](https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/5569408d-3300-4b5c-b4b8-6e8baa5ad413.gif?ClientID=vimeo-core-prod&Date=1663953976&Signature=3840517f68f618fa3b48788f5cc5c1579d95b46b)](https://vimeo.com/752964835)

## How to Use

Install the plugin by searching "Min Width" in the community plugins. Or manually copy over `main.js`, `manifest.json` in the release to the folder `.obsidian/plugins/obsidian-min-width/` in your vault.

The default settings set the minimum width to either 40 columns or 88% of the whole editing area, depending on which is smaller. The settings tab also supports overriding the minimum width for different view types. Following is a list of some known view types:

- `markdown`: The markdown editor
- `excalidraw`: The view type used by plugin Excalidraw and Excalibrain.

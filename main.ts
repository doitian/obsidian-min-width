import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface MinWidthPluginSettings {
	maxWidthPercent: string;
	defaultMinWidth: string;
	minWidthOfViewType: Record<string, string>;
}

const DEFAULT_SETTINGS: MinWidthPluginSettings = {
	maxWidthPercent: "88%",
	defaultMinWidth: "40rem",
	minWidthOfViewType: {},
};

const DATA_VIEW_TYPE = "data-min-width-plugin-view-type";
const CLASS_ACTIVE = "min-width-plugin-active";

function defaultSetting(setting, defaultValue: string): string {
	if (setting === undefined || setting === null || setting.trim() === "") {
		return defaultValue;
	}
	return setting;
}

function setOrRemoveDataType(el, dataType) {
	if (dataType !== undefined) {
		el.setAttribute(DATA_VIEW_TYPE, dataType);
	} else {
		el.removeAttribute(DATA_VIEW_TYPE);
	}
}

export default class MinWidthPlugin extends Plugin {
	settings: MinWidthPluginSettings;
	styleTag: HTMLStyleElement;

	async onload() {
		await this.loadSettings();

		this.styleTag = document.createElement("style");
		this.styleTag.id = "min-width-plugin-style";
		this.injectStyles();
		document.getElementsByTagName("head")[0].appendChild(this.styleTag);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MinWidthSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				this.removeClasses();

				// bubble up data-type
				const dataType = leaf.containerEl
					.getElementsByClassName("workspace-leaf-content")[0]
					?.getAttribute("data-type");
				setOrRemoveDataType(leaf.containerEl, dataType);

				// add active class and data-type to current horizontal split container
				const parentNode = leaf.containerEl.parentNode;
				console.log(parentNode);
				console.log(parentNode.classList);
				if (parentNode.classList.contains("mod-horizontal")) {
					parentNode.classList.add(CLASS_ACTIVE);
					setOrRemoveDataType(parentNode, dataType);
				}
			})
		);
	}

	onunload() {
		console.log("UNLOAD...");
		console.log(
			`.mod-horizontal[${DATA_VIEW_TYPE}], .workspace-leaf[${DATA_VIEW_TYPE}]`
		);
		this.styleTag.remove();
		this.removeClasses();
		for (const el of this.app.workspace.containerEl.querySelectorAll(
			`.mod-horizontal[${DATA_VIEW_TYPE}], .workspace-leaf[${DATA_VIEW_TYPE}]`
		)) {
			console.log(`remove ${DATA_VIEW_TYPE} from ${el}`);
			el.removeAttribute(DATA_VIEW_TYPE);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.injectStyles();
	}

	injectStyles() {
		const { maxWidthPercent, defaultMinWidth, minWidthOfViewType } =
			this.settings;
		const cssStyles = `
			.mod-root .mod-active,
			.mod-root .${CLASS_ACTIVE} {
				min-width: min(${maxWidthPercent}, ${defaultMinWidth});
			}
			${Object.entries(minWidthOfViewType)
				.map(
					([viewType, minWidth]) => `
			.mod-root .mod-active[${DATA_VIEW_TYPE}="${viewType}"],
			.mod-root .${CLASS_ACTIVE}[${DATA_VIEW_TYPE}="${viewType}"] {
				min-width: min(${maxWidthPercent}, ${minWidth});
			}
			`
				)
				.join(" ")}
		`
			.trim()
			.replace(/[\r\n\s]+/g, " ");
		console.log(cssStyles);
		this.styleTag.innerText = cssStyles;
	}

	removeClasses() {
		for (const el of this.app.workspace.containerEl.getElementsByClassName(
			CLASS_ACTIVE
		)) {
			el.classList.remove(CLASS_ACTIVE);
		}
	}
}

class MinWidthSettingTab extends PluginSettingTab {
	plugin: MinWidthPlugin;

	constructor(app: App, plugin: MinWidthPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Min Width Settings" });

		new Setting(containerEl)
			.setName("Max Width Percent")
			.setDesc(
				"Set the upper bound of the min width to the percentage of the whole editing area."
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.maxWidthPercent)
					.setValue(this.plugin.settings.maxWidthPercent)
					.onChange(async (value) => {
						this.plugin.settings.maxWidthPercent = defaultSetting(
							value,
							DEFAULT_SETTINGS.maxWidthPercent
						);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Min Width")
			.setDesc(
				"Set the minimum width of the active pane. The format is a number followed by a unit, e.g. 40rem. The unit can be px, rem, em, vw, vh, vmin, vmax, %."
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.defaultMinWidth)
					.setValue(this.plugin.settings.defaultMinWidth)
					.onChange(async (value) => {
						this.plugin.settings.defaultMinWidth = defaultSetting(
							value,
							DEFAULT_SETTINGS.defaultMinWidth
						);
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", {
			text: "View Types Settings",
		});

		for (const [viewType, minWidth] of Object.entries(
			this.plugin.settings.minWidthOfViewType
		)) {
			new Setting(containerEl)
				.setName(viewType)
				.setDesc('The same format as "Min Width"')
				.addText((text) =>
					text.setValue(minWidth).onChange(async (value) => {
						this.plugin.settings.minWidthOfViewType[viewType] =
							defaultSetting(
								value,
								DEFAULT_SETTINGS.defaultMinWidth
							);
						await this.plugin.saveSettings();
					})
				)
				.addButton((button) => {
					button.setIcon("trash").onClick(async () => {
						delete this.plugin.settings.minWidthOfViewType[
							viewType
						];
						this.display();
						await this.plugin.saveSettings();
					});
				});
		}

		let newViewType = "";
		new Setting(containerEl)
			.addText((text) =>
				text
					.setValue(newViewType)
					.onChange(async (value) => (newViewType = value.trim()))
			)
			.addButton((button) =>
				button.setButtonText("Add View Type").onClick(async () => {
					if (
						newViewType !== "" &&
						!(
							newViewType in
							this.plugin.settings.minWidthOfViewType
						)
					) {
						this.plugin.settings.minWidthOfViewType[newViewType] =
							"";
						this.display();
					}
				})
			);
	}
}

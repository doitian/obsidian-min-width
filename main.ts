import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

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

function defaultSetting(
	value: string | undefined | null,
	defaultValue: string
): string {
	if (value === undefined || value === null || value.trim() === "") {
		return defaultValue;
	}
	return value;
}

function setOrRemoveDataType(el: HTMLElement, dataType: string | null) {
	if (dataType !== null) {
		el.setAttribute(DATA_VIEW_TYPE, dataType);
	} else {
		el.removeAttribute(DATA_VIEW_TYPE);
	}
}

function debounce(func: (...args: any[]) => void, wait: number) {
	let timeout: number | undefined = undefined;
	return (...args: any[]) => {
		const later = () => {
			timeout = undefined;
			func(...args);
		};
		window.clearTimeout(timeout);
		timeout = window.setTimeout(later, wait);
	};
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
			this.app.workspace.on(
				"active-leaf-change",
				debounce((leaf) => this.onActiveLeafChange(leaf), 200)
			)
		);
	}

	onActiveLeafChange(leaf: WorkspaceLeaf) {
		this.removeClasses();

		if (leaf === null) {
			return;
		}

		const leafEl = leaf.view.containerEl.parentElement;
		if (leafEl === null) {
			return;
		}

		leafEl.classList.add(CLASS_ACTIVE);

		// bubble up data-type
		const dataType = leaf.view.containerEl.getAttribute("data-type");
		setOrRemoveDataType(leafEl, dataType);

		// add active class and data-type to current horizontal split container
		const leafParentEl = leafEl.parentElement;
		if (
			leafParentEl !== null &&
			leafParentEl.classList.contains("mod-horizontal")
		) {
			leafParentEl.classList.add(CLASS_ACTIVE);
			setOrRemoveDataType(leafParentEl, dataType);
		}
	}

	onunload() {
		this.styleTag.remove();
		this.removeClasses();
		this.app.workspace.containerEl
			.querySelectorAll(
				`.mod-horizontal[${DATA_VIEW_TYPE}], .workspace-leaf[${DATA_VIEW_TYPE}]`
			)
			.forEach((el) => el.removeAttribute(DATA_VIEW_TYPE));
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
			.mod-root .${CLASS_ACTIVE} {
				min-width: min(${maxWidthPercent}, ${defaultMinWidth});
			}
			${Object.entries(minWidthOfViewType)
				.map(
					([viewType, minWidth]) => `
			.mod-root .${CLASS_ACTIVE}[${DATA_VIEW_TYPE}="${viewType}"] {
				min-width: min(${maxWidthPercent}, ${minWidth});
			}
			`
				)
				.join(" ")}
		`
			.trim()
			.replace(/[\r\n\s]+/g, " ");
		this.styleTag.innerText = cssStyles;
	}

	removeClasses() {
		const elements = Array.from(
			this.app.workspace.containerEl.getElementsByClassName(CLASS_ACTIVE)
		);
		elements.forEach((el) => el.classList.remove(CLASS_ACTIVE));
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

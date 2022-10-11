import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
	debounce,
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

export default class MinWidthPlugin extends Plugin {
	settings: MinWidthPluginSettings;
	styleTag: HTMLStyleElement;

	async onload() {
		await this.loadSettings();

		const head = window.activeDocument.head;
		this.styleTag = head.createEl("style");
		this.styleTag.id = "min-width-plugin-style";
		this.injectStyles();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MinWidthSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on(
				"active-leaf-change",
				debounce((leaf) => this.onActiveLeafChange(leaf), 200)
			)
		);
	}

	onActiveLeafChange(leaf: WorkspaceLeaf | null) {
		if (leaf === null) {
			return;
		}

		const leafEl = leaf.view.containerEl.parentElement;
		if (leafEl === null) {
			return;
		}

		this.removeClassesFrom(leafEl.doc.body);
		leafEl.addClass(CLASS_ACTIVE);

		// bubble up data-type
		const dataType = leaf.view.containerEl.getAttribute("data-type");
		leafEl.setAttr(DATA_VIEW_TYPE, dataType);

		// add active class and data-type to current horizontal split container
		const leafParentEl = leafEl.parentElement;
		if (leafParentEl !== null && leafParentEl.hasClass("mod-horizontal")) {
			leafParentEl.addClass(CLASS_ACTIVE);
			leafParentEl.setAttr(DATA_VIEW_TYPE, dataType);
		}
	}

	onunload() {
		// Empty first to clear the styles in popout windows
		this.styleTag.innerText = "";
		this.styleTag.remove();

		// Leave the classes and attributes in the popout windows, because I don't know to to remove them.
		this.removeClassesFrom(window.activeDocument.body);
		window.activeDocument.body
			.findAll(
				`.mod-horizontal[${DATA_VIEW_TYPE}], .workspace-leaf[${DATA_VIEW_TYPE}]`
			)
			.forEach((el) => el.setAttr(DATA_VIEW_TYPE, null));
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

	removeClassesFrom(rootEl: HTMLElement) {
		rootEl
			.findAll(`.${CLASS_ACTIVE}`)
			.forEach((el) => el.removeClass(CLASS_ACTIVE));
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

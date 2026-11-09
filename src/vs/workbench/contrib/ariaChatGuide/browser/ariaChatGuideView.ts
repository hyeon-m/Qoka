/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { append, $, clearNode } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewDescriptorService } from '../../../common/views.js';

/** The two chat extensions, by the names people see in the Extensions tab. */
const CHAT_EXTENSIONS: { name: string; id: string }[] = [
	{ name: 'Claude Code for VS Code', id: 'anthropic.claude-code' },
	{ name: 'Codex – OpenAI\'s coding agent', id: 'openai.chatgpt' },
];

/**
 * Shown in the right-hand chat panel while neither Claude Code nor Codex is installed,
 * so the panel is not just empty: it says where the chat comes from (an extension) and
 * how to install one, with the same Extensions icon as in the left bar.
 */
export class AriaChatGuideView extends ViewPane {

	static readonly ID = 'aria.chatGuide.main';

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
		@ICommandService private readonly commandService: ICommandService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	private root: HTMLElement | undefined;

	protected override renderBody(container: HTMLElement): void {
		super.renderBody(container);
		this.root = append(container, $('div.aria-chat-guide'));
		this.root.style.cssText = 'padding:20px 16px;font-size:13px;line-height:1.55;color:var(--vscode-foreground);overflow:auto;height:100%;box-sizing:border-box;';
		this.draw();
	}

	private draw(): void {
		const root = this.root;
		if (!root) { return; }
		clearNode(root);
		const big = append(root, $('div'));
		big.style.cssText = 'display:flex;justify-content:center;margin:8px 0 14px;opacity:.85;';
		const bigIcon = append(big, renderIcon(Codicon.extensions));
		bigIcon.style.fontSize = '40px';

		const title = append(root, $('div'));
		title.textContent = 'No AI chat yet';
		title.style.cssText = 'font-size:15px;font-weight:600;text-align:center;margin-bottom:6px;';

		const lead = append(root, $('div'));
		lead.textContent = 'The chat in this panel comes from an extension. Install one of these to start chatting:';
		lead.style.cssText = 'text-align:center;color:var(--vscode-descriptionForeground);margin-bottom:16px;';

		const steps = append(root, $('ol'));
		steps.style.cssText = 'margin:0 0 16px;padding-left:20px;display:flex;flex-direction:column;gap:8px;';

		const s1 = append(steps, $('li'));
		append(s1, document.createTextNode('Click the Extensions icon '));
		const inline = append(s1, renderIcon(Codicon.extensions));
		inline.style.cssText = 'vertical-align:text-bottom;';
		append(s1, document.createTextNode(' in the left bar.'));

		const s2 = append(steps, $('li'));
		append(s2, document.createTextNode('Search for and install '));
		const n1 = append(s2, $('b'));
		n1.textContent = CHAT_EXTENSIONS[0].name;
		append(s2, document.createTextNode(' or '));
		const n2 = append(s2, $('b'));
		n2.textContent = CHAT_EXTENSIONS[1].name;
		append(s2, document.createTextNode('.'));

		const s3 = append(steps, $('li'));
		s3.textContent = 'The chat then opens here, on the right.';

		const buttons = append(root, $('div'));
		buttons.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
		for (const ext of CHAT_EXTENSIONS) {
			const b = append(buttons, $('button'));
			b.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 10px;border:none;border-radius:4px;cursor:pointer;font:inherit;'
				+ 'background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);';
			append(b, renderIcon(Codicon.extensions));
			append(b, document.createTextNode(`Find ${ext.name}`));
			b.onclick = () => { void this.commandService.executeCommand('workbench.extensions.search', `@id:${ext.id}`); };
		}
	}
}

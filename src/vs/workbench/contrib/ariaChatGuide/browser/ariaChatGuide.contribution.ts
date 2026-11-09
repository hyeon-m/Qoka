/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from '../../../../platform/registry/common/platform.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { registerIcon } from '../../../../platform/theme/common/iconRegistry.js';
import { localize, localize2 } from '../../../../nls.js';
import {
	ViewContainer, ViewContainerLocation,
	IViewContainersRegistry, Extensions as ViewContainerExtensions,
	IViewsRegistry, Extensions as ViewExtensions,
	IViewDescriptor,
} from '../../../common/views.js';
import { ViewPaneContainer } from '../../../browser/parts/views/viewPaneContainer.js';
import { IContextKeyService, RawContextKey } from '../../../../platform/contextkey/common/contextkey.js';
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from '../../../common/contributions.js';
import { LifecyclePhase } from '../../../services/lifecycle/common/lifecycle.js';
import { IExtensionService } from '../../../services/extensions/common/extensions.js';
import { IViewsService } from '../../../services/views/common/viewsService.js';
import { IWorkspaceContextService, WorkbenchState } from '../../../../platform/workspace/common/workspace.js';
import { AriaChatGuideView } from './ariaChatGuideView.js';

/** True once Qoka has checked and found neither Claude Code nor Codex installed. */
export const AI_CHAT_MISSING = new RawContextKey<boolean>('aria.aiChatMissing', false);
export const ARIA_CHAT_GUIDE_CONTAINER_ID = 'workbench.view.ariaChatGuide';
const CHAT_EXTENSION_IDS = ['anthropic.claude-code', 'openai.chatgpt'];

const CONTAINER_ID = ARIA_CHAT_GUIDE_CONTAINER_ID;

const chatGuideIcon = registerIcon('aria-chat-guide-view', Codicon.commentDiscussion, localize('aria.chatGuide.iconLabel', "AI chat guide icon"));

// In the right-hand panel (auxiliary bar), where the Claude Code / Codex chat appears.
// hideIfEmpty: once a chat extension is installed the view's `when` turns false and
// the whole container disappears, leaving the panel to that extension's chat.
const viewContainer: ViewContainer = Registry.as<IViewContainersRegistry>(ViewContainerExtensions.ViewContainersRegistry)
	.registerViewContainer({
		id: CONTAINER_ID,
		title: localize2('aria.chatGuide.containerTitle', "AI Chat"),
		ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
		hideIfEmpty: true,
		icon: chatGuideIcon,
		order: 100,
	}, ViewContainerLocation.AuxiliaryBar, { doNotRegisterOpenCommand: true });

const chatGuideView: IViewDescriptor = {
	id: AriaChatGuideView.ID,
	name: localize2('aria.chatGuide.viewName', "AI Chat"),
	containerIcon: chatGuideIcon,
	ctorDescriptor: new SyncDescriptor(AriaChatGuideView),
	canToggleVisibility: false,
	canMoveView: false,
	when: AI_CHAT_MISSING,
	order: 1,
};

Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews([chatGuideView], viewContainer);

/** Keeps `aria.aiChatMissing` in step with the installed extensions. */
class AriaChatGuideContribution extends Disposable implements IWorkbenchContribution {
	constructor(
		@IExtensionService private readonly extensionService: IExtensionService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewsService private readonly viewsService: IViewsService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
	) {
		super();
		const missing = AI_CHAT_MISSING.bindTo(contextKeyService);
		const update = () => {
			const ids = new Set(this.extensionService.extensions.map(e => e.identifier.value.toLowerCase()));
			const none = !CHAT_EXTENSION_IDS.some(id => ids.has(id));
			const was = missing.get();
			missing.set(none);
			// The right-hand panel opens before Qoka knows no AI extension is installed, so it has
			// nothing to show yet; open the guide in it the moment that is known (project windows).
			if (none && !was && this.workspaceContextService.getWorkbenchState() !== WorkbenchState.EMPTY) {
				void this.viewsService.openViewContainer(CONTAINER_ID, false);
			}
		};
		// Decide only once the installed extensions are known, so the guide never flashes
		// for someone who already has a chat extension.
		void this.extensionService.whenInstalledExtensionsRegistered().then(update);
		this._register(this.extensionService.onDidChangeExtensions(() => update()));
	}
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(AriaChatGuideContribution, LifecyclePhase.Restored);


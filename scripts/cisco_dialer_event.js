/*
 *   Cisco Dialer - Chrome Extension
 *   Copyright (C) 2015 Christian Volmering <christian@volmering.name>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var ciscoDialerEventHandler = new function () {
	this.contextMenuInstalled = false;
	this.omniBoxInstalled     = false;
	this.configTabOpened      = false;

	this.onContextMenuClick = function (info, tab) {
		new ciscoDialerPhoneNumber(info.selectionText).dial(false);
	};

	this.installContextMenu = function () {
		if ((ciscoDialer.configOptions.contextMenu == 'true')
			&& !this.contextMenuInstalled) {
			
			chrome.contextMenus.create({
				'title':    chrome.i18n.getMessage('dial_label', '%s'),
				'contexts': ['selection'],
				'id':       'contextMenu@' + chrome.i18n.getMessage('@@extension_id')
			}, function() {
				if (chrome.runtime.lastError) {
					ciscoDialer.log(chrome.runtime.lastError.message);
				}
			});
			
			chrome.contextMenus.onClicked.addListener(
				this.onContextMenuClick.bind(this));
			
			this.contextMenuInstalled = true;
		}
		else if ((ciscoDialer.configOptions.contextMenu == 'false')
			&& this.contextMenuInstalled) {
			
			this.contextMenuInstalled = false;
			
			chrome.contextMenus.remove('contextMenu@'
				+ chrome.i18n.getMessage('@@extension_id'));
		}
	};

	this.installOmniBox = function () {
		if (!this.omniBoxInstalled) {
			chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
				chrome.omnibox.setDefaultSuggestion({
					description: chrome.i18n.getMessage('dial_label',
						text ? '<match>' + text + '</match>' : '<dim>...</dim>')
				});
			});
			
			chrome.omnibox.onInputEntered.addListener(function(text) {
				new ciscoDialerPhoneNumber(text).dial(false);
			});
			
			this.omniBoxInstalled = true;
		}
	};

	this.openConfigTab = function () {
		if (!this.configTabOpened) {
			var optionsUrl = '';
			
			if (/Chrome\/4/.test(window.navigator.userAgent)) {
				optionsUrl = 'chrome://extensions/?options='
					+ chrome.i18n.getMessage('@@extension_id');
			}
			else {
				optionsUrl = 'chrome-extension://'
					 + chrome.i18n.getMessage('@@extension_id')
					 + chrome.runtime.getManifest().options_page;
			}
			
			chrome.tabs.create({
				url:    optionsUrl,
				active: true
			});
			
			this.configTabOpened = true;
		}
	};

	this.onInstalled = function () {
		this.onConfigChanged(this);
	};

	this.onConfigChanged = function (sender) {
		if (ciscoDialer.canDial()) {
			this.installContextMenu();
			this.installOmniBox();
		}
		else if (ciscoDialer.loaded) {
			this.openConfigTab();
		}
	};

	ciscoDialer.processEvents();
	ciscoDialer.notifyOnChange(this.onConfigChanged.bind(this));

	chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
}
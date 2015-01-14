/*
 *   Cisco Dialer - Chrome Extension
 *   Copyright (C) 2014 Christian Volmering <christian@volmering.name>
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
	this.configTabOpened = false;

    this.onContextMenuClick = function (info, tab) {
        new ciscoDialerPhoneNumber(info.selectionText).dial();
    };

    this.installContextMenu = function () {
        if ((ciscoDialer.configOptions.contextMenu == 'true') && !this.contextMenuInstalled) {
            chrome.contextMenus.create({
                'title': chrome.i18n.getMessage('dial_label', '%s'),
                'contexts': ['selection'],
                'id': chrome.i18n.getMessage('@@extension_id')
            });

            chrome.contextMenus.onClicked.addListener(this.onContextMenuClick.bind(this));
            this.contextMenuInstalled = true;
        }
		else if ((ciscoDialer.configOptions.contextMenu == 'false') && this.contextMenuInstalled) {
			this.contextMenuInstalled = false;
			chrome.contextMenus.remove(chrome.i18n.getMessage('@@extension_id'));
		}
    };

	this.openConfigTab = function () {
		if (!this.configTabOpened) {
			chrome.tabs.create({
				url: 'chrome-extension://'
					 + chrome.i18n.getMessage('@@extension_id')
					 + chrome.runtime.getManifest().options_page,
				active: true});

			this.configTabOpened = true;
		}
	}

    this.onInstalled = function () {
		this.onConfigChanged(this);
	};

    this.onConfigChanged = function (sender) {
        if (ciscoDialer.canDial()) {
            this.installContextMenu();
        }
		else if (ciscoDialer.loaded) {
			this.openConfigTab();
		}
    };

    ciscoDialer.processEvents();
    ciscoDialer.notifyOnChange(this.onConfigChanged.bind(this));

    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
}
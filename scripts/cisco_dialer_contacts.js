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

var ciscoDialerGoogleContactsScript = new function () {
	this.listening = false;
	this.eventName = 'DOMSubtreeModified';
	this.styles    = {};

	this.getDialElement = function (typeName) {
		var labelCaption = chrome.i18n.getMessage('dial_label', typeName);
		if (!labelCaption) {
			labelCaption = 'Dial' + (typeName ? ' ' + typeName : '');
		}

		var rootNode = document.createElement('span');
		rootNode.setAttribute('class', this.styles.rootClass);

		var containerNode = document.createElement('div');
		containerNode.setAttribute('class', this.styles.containerClass);

		var imageNode = document.createElement('img');
		imageNode.rootNode = rootNode;
		imageNode.setAttribute('class', this.styles.imageClass);
		imageNode.setAttribute('src', 'images/cleardot.gif');
		imageNode.setAttribute('aria-label', labelCaption);
		imageNode.setAttribute('data-tooltip', labelCaption);

		containerNode.appendChild(imageNode);
		rootNode.appendChild(containerNode);

		rootNode.onmouseover = function (mouseOverImageEvent) {
			mouseOverImageEvent.target.className += ' ' + this.styles.hoverClass;
		}.bind(this);

		rootNode.onmouseout = function (mouseOutImageEvent) {
			mouseOutImageEvent.target.className = mouseOutImageEvent.target.className.replace(
				' ' + this.styles.hoverClass, '');
		}.bind(this);

		return rootNode;
	};

	this.extensionAlive = function () {
		if (chrome.i18n.getMessage('@@extension_id') != undefined) {
			return true;
		}

		if (this.listening) {
			document.removeEventListener(this.eventName,
				this.onContentModified.bind(this), false);

			var dialIcons = document.getElementsByClassName('cisco_dial');
			for (var iconIndex = 0, iconCount = dialIcons.length;
				iconIndex < iconCount; iconIndex++) {
			    dialIcons[0].rootNode.parentNode.removeChild(dialIcons[0].rootNode);
			}

			this.listening = false;
		}

		return false;
	};

	this.onContentModified = function (subTreeModifiedEvent) {
		var dialEntry = subTreeModifiedEvent.target;
		if (dialEntry.className != this.styles.entryClass) {
			return;
		}

		dialEntry.onmouseover = function (mouseOverEntryEvent) {
			if (!this.extensionAlive()) {
				return;
			}

			var inputFields = mouseOverEntryEvent.target.getElementsByTagName('input');
			if (!((inputFields.length > 0)
				&& (inputFields[inputFields.length - 1].dir == 'ltr'))) {
				return;
			}

			var dialNumberField = inputFields[1];
			var dialIcons = dialEntry.getElementsByClassName('cisco_dial');
			if (!dialNumberField.value.trim() || (dialIcons.length > 0)) {
				return;
			}

			var newNode = this.getDialElement(inputFields[0].value);
			newNode.onclick = function (onClickEvent) {
				new ciscoDialerPhoneNumber(dialNumberField.value).dial();
			};

			dialEntry.appendChild(newNode);
		}.bind(this);
	};

	this.initStyles = function () {
		if (document.domain == 'mail.google.com') {
			this.styles = {
				'entryClass':     'acq',
				'rootClass':      'RW',
				'containerClass': 'acy J-J5-Ji',
				'imageClass':     'abG cisco_dial d5',
				'hoverClass':     'RP'
			};
		} else {
			this.styles = {
				'entryClass':     'zhiDhf',
				'rootClass':      'pX8lof',
				'containerClass': 'xd7oXd VIpgJd-TzA9Ye-eEGnhe',
				'imageClass':     'R6l9wc cisco_dial QYqDmc',
				'hoverClass':     'xA8pNd'
			};
		}
	};

	this.onConfigChanged = function (sender) {
		if (!this.listening && sender.canDial()) {
			document.addEventListener(this.eventName,
				this.onContentModified.bind(this), false);

			this.initStyles();
			this.listening = true;
		}
	};

	ciscoDialer.notifyOnChange(this.onConfigChanged.bind(this));
}

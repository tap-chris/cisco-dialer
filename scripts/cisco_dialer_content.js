/*
 *   Cisco Dialer - Chrome Extension
 *   Copyright (C) 2013 Christian Volmering <christian@volmering.name>
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

function ciscoSendRuntimeMessage(parameters) {
	chrome.runtime.sendMessage(chrome.i18n.getMessage('@@extension_id'), parameters);
}

function ciscoShowMessage(message, placeholders) {
	ciscoSendRuntimeMessage({'notification': chrome.i18n.getMessage(message, placeholders)});
}

function ciscoSendXmlRequest(uri, request, user, secret) {
	ciscoSendRuntimeMessage({'sendxml': {
		'uri': uri,
		'request': request,
		'user': user,
		'secret': secret
	}});
}

function ciscoGetDialElement(typeName) {
	var labelCaption = chrome.i18n.getMessage('dial_label', typeName);
	if (!labelCaption) {
		labelCaption = 'Dial' + (typeName ? ' ' + typeName : '');
	}
	
	var rootNode = document.createElement('span');
	rootNode.setAttribute('class', document.ciscoConfig.styles.rootClass);
	
	var containerNode = document.createElement('div');
	containerNode.setAttribute('class', document.ciscoConfig.styles.containerClass);
	
	var imageNode = document.createElement('img');
	imageNode.setAttribute('class', document.ciscoConfig.styles.imageClass);
 	imageNode.setAttribute('src', 'images/cleardot.gif');
	imageNode.setAttribute('aria-label', labelCaption);
	imageNode.setAttribute('data-tooltip', labelCaption);
	
	containerNode.appendChild(imageNode);
	rootNode.appendChild(containerNode);

	rootNode.onmouseover = function(mouseOverImageEvent) {
		mouseOverImageEvent.target.className += ' ' + document.ciscoConfig.styles.hoverClass;
	};

	rootNode.onmouseout = function(mouseOutImageEvent) {
		mouseOutImageEvent.target.className = mouseOutImageEvent.target.className.replace(
			' ' + document.ciscoConfig.styles.hoverClass, '');
	};

	return rootNode;
}

function ciscoUpdatePage(subTreeModifiedEvent) {
	var dialEntry = subTreeModifiedEvent.target;
	if (dialEntry.className != document.ciscoConfig.styles.entryClass) {
		return;
	}

	dialEntry.onmouseover = function(mouseOverEntryEvent) {
		var inputFields = mouseOverEntryEvent.target.getElementsByTagName('input');
		if (!((inputFields.length > 0) && (inputFields[inputFields.length-1].dir == 'ltr'))) {
			return;
		}

		var dialNumberField = inputFields[1];
		if (!dialNumberField.value.trim() 
			|| dialEntry.getElementsByClassName('cisco_dial').length > 0) {
			return;
		}
		
		var newNode = ciscoGetDialElement(inputFields[0].value);
		newNode.onclick = function(onClickEvent) {
			var dialNumber = dialNumberField.value.trim();
			if (document.ciscoConfig.normalizeNumber) {
				dialNumber = dialNumber.replace(/[\.\-\(\)\[\]\{\}\/\s]/g, '');
			}
			
			if (document.ciscoConfig.replacePlusPrefix) {
				dialNumber = dialNumber.replace(/^\+/, document.ciscoConfig.intExitCode);
			}
			
			ciscoSendXmlRequest(
				document.ciscoConfig.destinationUri,
				document.ciscoConfig.dialCommandXml.replace(/{number}/, dialNumber),
				document.ciscoConfig.authUser,
				document.ciscoConfig.authSecret);
		};

		dialEntry.appendChild(newNode);
	};
}

function ciscoInitStyles() {
	if (!document.ciscoConfig) {
		return;
	}

	if (document.domain == 'mail.google.com') {
		document.ciscoConfig.styles = {
			'entryClass': 'acq',
			'rootClass': 'RW',
			'containerClass': 'acy J-J5-Ji',
			'imageClass': 'abG cisco_dial d5',
			'hoverClass': 'RP'
		};
	}
	else {
		document.ciscoConfig.styles = {
			'entryClass': 'zhiDhf',
			'rootClass': 'pX8lof',
			'containerClass': 'xd7oXd VIpgJd-TzA9Ye-eEGnhe',
			'imageClass': 'R6l9wc cisco_dial QYqDmc',
			'hoverClass': 'xA8pNd'
		};
	}
}

function ciscoSetDestinationUri(phoneAdress) {
	document.ciscoConfig.destinationUri = 'http://' + phoneAdress + '/CGI/Execute';	
}

function ciscoSetDialCommand(telephonyUri) {
	document.ciscoConfig.dialCommandXml =
		'<CiscoIPPhoneExecute><ExecuteItem Priority="0" URL="' +
		telephonyUri.replace('"', '') + '"/></CiscoIPPhoneExecute>';
}

function ciscoSetInternationalExitCode(intExitCode) {
	if (intExitCode) {
		document.ciscoConfig.intExitCode = intExitCode;
		document.ciscoConfig.replacePlusPrefix = true;
	}
}

function ciscoSetAuthUser(user) {
	document.ciscoConfig.authUser = user ? user : '';
}

function ciscoSetAuthSecret(secret) {
	document.ciscoConfig.authSecret = secret ? sjcl.decrypt(
		sjcl.getSecret(document.ciscoConfig.phoneAdress), atob(secret)) : '';
}

function ciscoConfigChanged() {
	if (document.ciscoConfig.enabled) {
		return;
	}

	if (document.ciscoConfig.destinationUri && document.ciscoConfig.dialCommandXml) {
		document.addEventListener('DOMSubtreeModified', ciscoUpdatePage, false);
		document.ciscoConfig.enabled = true;
	}	
}

function ciscoConfigCallback(storage) {
	if (storage.phoneAdress) {
		document.ciscoConfig.phoneAdress = typeof storage.phoneAdress == 'object'
			? storage.phoneAdress.newValue : storage.phoneAdress;
		ciscoSetDestinationUri(document.ciscoConfig.phoneAdress);
	}

	if (storage.telephonyUri) {
		ciscoSetDialCommand(typeof storage.telephonyUri == 'object'
			? storage.telephonyUri.newValue : storage.telephonyUri);
	}
	
	if (storage.intExitCode) {
		ciscoSetInternationalExitCode(typeof storage.intExitCode == 'object'
			? storage.intExitCode.newValue : storage.intExitCode);
	}

	if (storage.authUser) {
		ciscoSetAuthUser(typeof storage.authUser == 'object'
			? storage.authUser.newValue : storage.authUser);
	}

	if (storage.authSecret) {
		ciscoSetAuthSecret(typeof storage.authSecret == 'object'
			? storage.authSecret.newValue : storage.authSecret);
	}

	ciscoConfigChanged();
}

function ciscoInitConfig() {
	document.ciscoConfig = {
		'enabled': false,
		'normalizeNumber': true,
		'replacePlusPrefix': false
	};

	chrome.storage.sync.get(
		['phoneAdress', 'telephonyUri', 'intExitCode', 'authUser', 'authSecret'],
		ciscoConfigCallback);
	chrome.storage.onChanged.addListener(ciscoConfigCallback);
}

ciscoInitConfig();
ciscoInitStyles();
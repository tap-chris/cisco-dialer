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
var ciscoDialer = new function () {
	this.loaded = false;
    this.listeners = [];
	this.priority = 1;
    this.configOptions = {
        phoneAdress: '',
        telephonyUri: 'Dial:{number}',
        countryCode: '',
        authUser: '',
        authSecret: '',
		contextMenu: 'false',
		inPageDial: 'false'
    };

    this.getPhoneExecuteUri = function () {
        return this.configOptions.phoneAdress ? 'http://' + this.configOptions.phoneAdress + '/CGI/Execute' : false;
    };

    this.getPhoneExecuteCommand = function (command) {
        return '<CiscoIPPhoneExecute>'
			+ '<ExecuteItem Priority="' + this.priority.toString() + '" URL="' + command.replace('"', '') + '"/>'
			+ '</CiscoIPPhoneExecute>';
    };

    this.getPhoneDialCommand = function (phoneNumber) {
        return this.getPhoneExecuteCommand(
            this.configOptions.telephonyUri.replace(/\{number\}/, phoneNumber.toString()));
    };

    this.decryptSecret = function (secret) {
        return sjcl.decrypt(sjcl.getSecret(
            this.configOptions.phoneAdress), atob(secret));
    };

    this.encryptSecret = function (secret) {
        return btoa(sjcl.encrypt(sjcl.getSecret(
            this.configOptions.phoneAdress), secret));
    };

    this.onConfigChanged = function (chromeStorage) {
        for (var option in this.configOptions) {
            if (chromeStorage[option]) {
                this.configOptions[option] = typeof chromeStorage[option] == 'object' ? chromeStorage[option].newValue : chromeStorage[option];
            }
        }

		this.loaded = true;

        for (var index = 0, size = this.listeners.length; index < size; index++) {
            this.listeners[index](this);
        }
    };

    this.onDialRequest = function (phoneNumber) {
        this.sendRequest(
            this.getPhoneExecuteUri(),
            this.getPhoneDialCommand(phoneNumber),
            this.onDialResponse.bind(this));
    };

    this.onDialResponse = function (response) {
        if (response.readyState == 4) {
            if (!response.status) {
                this.showMessage('error_connection_failed');
            } else if (response.status != 200) {
                this.showMessage('error_dial_failed', [response.status, response.statusText]);
            }
        }
    };

    this.onRuntimeMessage = function (request, sender, sendResponse) {
        if (request.dial) {
            this.onDialRequest(request.dial.phoneNumber);
        }
    };

    this.sendRequest = function (uri, request, onResponse) {
        var xmlHttp = new XMLHttpRequest();

        xmlHttp.onreadystatechange = function () {
            onResponse(xmlHttp)
        };
        xmlHttp.open('POST', uri, true,
            this.configOptions.authUser,
            this.decryptSecret(this.configOptions.authSecret));
        xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xmlHttp.send('XML=' + encodeURIComponent(request).replace(/%20/g, '+'));
    };

    this.sendRuntimeMessage = function (parameters) {
        chrome.runtime.sendMessage(chrome.i18n.getMessage('@@extension_id'), parameters);
    };

    this.showMessage = function (message, placeholders) {
        chrome.notifications.create('', {
            type: 'basic',
            title: chrome.i18n.getMessage('extension_name'),
            message: chrome.i18n.getMessage(message, placeholders),
            iconUrl: 'chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/images/error_icon.png'
        }, function (notificationId) {});
    };

    this.canDial = function () {
        return this.configOptions.phoneAdress
			&& this.configOptions.telephonyUri
			&& this.configOptions.countryCode;
    };

    this.dialNumber = function (phoneNumber) {
        if (this.canDial()) {
            this.sendRuntimeMessage({
                'dial': {
                    'phoneNumber': new ciscoDialerPhoneNumber(phoneNumber).normalize().format(this.configOptions.countryCode).toString()
                }
            });
        }
    };

    this.processEvents = function () {
        chrome.runtime.onMessage.addListener(this.onRuntimeMessage.bind(this));		
    };

    this.notifyOnChange = function (onChange) {
        this.listeners.push(onChange);
    };

    chrome.storage.sync.get(this.configOptions, this.onConfigChanged.bind(this));
    chrome.storage.onChanged.addListener(this.onConfigChanged.bind(this));
}

function ciscoDialerPhoneNumber(phoneNumber) {
    this.value = typeof phoneNumber == 'ciscoDialerPhoneNumber' ? phoneNumber.toString() : new String(phoneNumber);

    this.normalize = function () {
        this.value = this.value.trim();
        return this;
    };

    this.format = function (countryCode) {
		var newValue = null;
		
		if (!this.value.indexOf('*') == 0) {
			var newValue = cleanPhone(formatCisco(countryCode, this.value));
		}
		
		if (newValue != null) {
            this.value = newValue;
        }
		
        return this;
    };

    this.toString = function () {
        return this.value;
    };

    this.dial = function () {
        return ciscoDialer.dialNumber(this.toString());
    };
}
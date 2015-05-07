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
	this.loaded        = false;
	this.listeners     = [];
	this.priority      = 1;
	this.configOptions = {
		phoneAdress:  '',
		telephonyUri: 'Dial:{number}',
		countryCode:  '',
		authUser:     '',
		authSecret:   '',
		contextMenu:  'false',
		inPageDial:   'false'
	};

	this.getPhoneExecuteUri = function () {
		return this.configOptions.phoneAdress ? 'http://'
			+ this.configOptions.phoneAdress + '/CGI/Execute' : false;
	};

	this.getPhoneExecuteCommand = function (command) {
		return '<CiscoIPPhoneExecute>'
			+ '<ExecuteItem Priority="' + this.priority.toString()
			+ '" URL="' + command.replace('"', '') + '"/>'
			+ '</CiscoIPPhoneExecute>';
	};

	this.getPhoneDialCommand = function (phoneNumber) {
		return this.getPhoneExecuteCommand(
			this.configOptions.telephonyUri.replace(
				/\{number\}/, phoneNumber.toString()));
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
				this.configOptions[option] = typeof chromeStorage[option] == 'object'
					? chromeStorage[option].newValue : chromeStorage[option];
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
			}
			else if (response.status != 200) {
				this.showMessage('error_dial_failed',
					[response.status, response.statusText]);
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
			onResponse(xmlHttp);
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
			type:    'basic',
			title:   chrome.i18n.getMessage('extension_name'),
			message: chrome.i18n.getMessage(message, placeholders),
			iconUrl: 'chrome-extension://'
				+ chrome.i18n.getMessage('@@extension_id')
				+ '/images/cisco_dialer_icon_error.png'
		}, function (notificationId) {});
	};

	this.canDial = function () {
		return this.configOptions.phoneAdress
			&& this.configOptions.telephonyUri
			&& this.configOptions.countryCode;
	};

	this.dialNumber = function (phoneNumber, runtime) {
		if (this.canDial()) {
			if (runtime === false) {
				this.onDialRequest(phoneNumber);
			}
			else {
				this.sendRuntimeMessage({'dial': {
					'phoneNumber': new ciscoDialerPhoneNumber(
						phoneNumber, this.configOptions.countryCode).format().clean().toString()
				}});
			}
		}
	};

	this.processEvents = function () {
		chrome.runtime.onMessage.addListener(this.onRuntimeMessage.bind(this));
	};

	this.notifyOnChange = function (onChange) {
		this.listeners.push(onChange);
	};
	
	this.log = function (message) {
		if (message) {
			console.log(chrome.i18n.getMessage('extension_name')
				+ ': ' + message.toString());
		}
	};
	
	chrome.storage.sync.get(this.configOptions, this.onConfigChanged.bind(this));
	chrome.storage.onChanged.addListener(this.onConfigChanged.bind(this));
}

function ciscoDialerPhoneNumber (phoneNumber, countryCode) {
	this.value     = typeof phoneNumber == 'ciscoDialerPhoneNumber' 
		? phoneNumber.toString() : new String(phoneNumber);
	this.rawValue  = this.value.trim();
	this.buffer    = null;
	this.country   = countryCode;
	this.phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();

	this.toString = function () {
		return this.value;
	};

	this.rawNumber = function () {
		return this.rawValue;
	};

	this.getRegion = function (countryCode) {
		return countryCode ? countryCode : this.country;
	};

	this.clean = function () {
		this.value = this.value.replace(/[^\d\+]/g, '');
		this.value = (this.value.substr(0, 1) == '+' ? '+' : '')
			+ this.value.replace(/[^\d]/g, '');
		return this;
	};

	this.getBuffer = function (countryCode) {
		if (!this.buffer) {
			try {
				this.buffer = this.phoneUtil.parseAndKeepRawInput(
					this.clean().toString(), this.getRegion(countryCode));
			}
			catch (error) {
				return null;
			}
		}
		
		return this.buffer;
	};

	this.valid = function (countryCode) {
		var number = this.getBuffer(this.getRegion(countryCode));
		return number !== null ? this.phoneUtil.isValidNumber(number) : false;
	};

	this.format = function (countryCode) {
		if (this.value.indexOf('*') === 0) {
			return this;
		}
		
		var number = this.getBuffer(this.getRegion(countryCode));
		if (number !== null) {
			if (this.phoneUtil.isValidNumberForRegion(number, this.getRegion(countryCode))) {
				this.value = this.phoneUtil.format(number,
					i18n.phonenumbers.PhoneNumberFormat.NATIONAL).toString();
			}
			else {
				this.value = this.phoneUtil.formatOutOfCountryCallingNumber(
					number, this.getRegion(countryCode)).toString();
			}
		}
		
		return this;
	};

	this.dial = function (runtime) {
		return ciscoDialer.dialNumber(this.toString(), runtime);
	};

	this.indexIn = function (list) {
		for	(var index = 0; index < list.length; index++) {
			if (list[index].rawNumber() == this.rawNumber()) {
				return index;
			}
		}
		
		return -1;
	};
}
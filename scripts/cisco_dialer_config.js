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

function configChanged() {
	var saveButton = document.getElementById('saveConfig');

	if (document.getElementById('phoneAdress').value && document.getElementById('telephonyUri').value) {
		saveButton.className = saveButton.className.replace(' button-disabled', '');
	}
	else {
		saveButton.className += ' button-disabled';
	} 
}

function restoreConfig(options) {
	if (!options) {
		options = ['phoneAdress', 'telephonyUri', 'intExitCode', 'authUser', 'authSecret'];
	}

	chrome.storage.sync.get(options, function(myStorage) {
		if (myStorage.phoneAdress) {
			document.ciscoConfig.phoneAdress = 
				document.getElementById('phoneAdress').value = myStorage.phoneAdress;
		}

		var telephonyUri = document.getElementById('telephonyUri');
		if (myStorage.telephonyUri) {
			telephonyUri.value = myStorage.telephonyUri;
		}
		else if (!telephonyUri.value.trim()) {
			telephonyUri.value = 'Dial:{number}';
		}

		var intExitCode = document.getElementById('intExitCode');
		if (myStorage.intExitCode) {
			intExitCode.value = myStorage.intExitCode;
		}
		else if (!intExitCode.value.trim() && !myStorage.phoneAdress) {
			// todo: Use location api instead
			switch (window.navigator.language)
			{
				case 'de':
				case 'fr':
				case 'en-GB':
					intExitCode.value = '00';
					break;
				case 'en':
				case 'en-US':
					intExitCode.value = '011';
					break;
				case 'ru':
					intExitCode.value = '001';
					break;				
				default:
					intExitCode.value = '';
			}
		}

		if (myStorage.authUser) {
			document.getElementById('authUser').value = myStorage.authUser;
		}
		
		if (myStorage.authSecret) {
			document.getElementById('authSecret').value = sjcl.decrypt(
				sjcl.getSecret(document.ciscoConfig.phoneAdress), atob(myStorage.authSecret));
		}
		
		configChanged();
	});
}

function saveConfig() {
	var phoneAdress = document.getElementById('phoneAdress').value;
	var telephonyUri = document.getElementById('telephonyUri').value;

	if (!(phoneAdress && telephonyUri)) {
		return;
	}

	chrome.permissions.request({
		origins: ['http://' + phoneAdress + '/CGI/Execute']
	}, function(permissionGranted) {
		var saveOptions = {
			'telephonyUri': telephonyUri,
			'authUser': document.getElementById('authUser').value,
			'intExitCode': document.getElementById('intExitCode').value
		};

		if (permissionGranted) {
			document.ciscoConfig.phoneAdress = 
				saveOptions.phoneAdress = phoneAdress;
		}
		else {
			restoreConfig(['phoneAdress']);
		}

		saveOptions.authSecret = btoa(sjcl.encrypt(
			sjcl.getSecret(document.ciscoConfig.phoneAdress),
			document.getElementById('authSecret').value));

		chrome.storage.sync.set(saveOptions, function() {
			var statusMessage = document.getElementById('statusMessage');

			statusMessage.innerHTML = chrome.i18n.getMessage('options_saved');
			setTimeout(function() {
				statusMessage.innerHTML = '';
			}, 750);				
		});			
	});		
}

function cancelConfig() {
	document.getElementById('phoneAdress').value
		= document.getElementById('telephonyUri').value
		= document.getElementById('intExitCode').value
		= document.getElementById('authUser').value
		= document.getElementById('authSecret').value
		= '';

	restoreConfig();
}

function initLanguage() {
	var lingualFields = {
		"pageTitle": "options_title",
		"headerTitle": "options_title",
		"phoneAddressLabel": "options_label_phone_address",
		"phoneAddressDescription": "options_description_phone_address",
		"authConfigLabel": "options_label_auth_config",
		"authConfigDescription": "options_description_auth_config",
		"authUserLabel": "options_label_username",
		"authPassLabel": "options_label_password",
		"telUriLabel": "options_label_telephony_uri",
		"telUriDescription": "options_description_telephony_uri",
		"intExitCodeLabel": "options_label_int_exit_code",
		"intExitCodeDescription": "options_description_int_exit_code",
		"saveConfig": "options_button_save",
		"cancelConfig": "options_button_cancel"
	};
	
	for (var fieldName in lingualFields) {
		if (lingualFields.hasOwnProperty(fieldName)) {
			document.getElementById(fieldName).innerHTML
				= chrome.i18n.getMessage(lingualFields[fieldName]);
		}
	}
}

function onContentLoaded() {
	document.ciscoConfig = {};
	initLanguage();
	restoreConfig();

	document.querySelector('#phoneAdress').addEventListener('input', configChanged);
	document.querySelector('#telephonyUri').addEventListener('input', configChanged);
	document.querySelector('#saveConfig').addEventListener('click', saveConfig);
	document.querySelector('#cancelConfig').addEventListener('click', cancelConfig);
}

document.addEventListener('DOMContentLoaded', onContentLoaded, false);
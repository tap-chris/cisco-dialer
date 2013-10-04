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

function ciscoShowMessage(message, placeholders) {
	chrome.notifications.create('', {
		type: 'basic',
		title: chrome.i18n.getMessage('extension_name'),
		message: chrome.i18n.getMessage(message, placeholders),
		iconUrl: 'chrome-extension://' 
			+ chrome.i18n.getMessage('@@extension_id')
			+ '/images/error_icon.png'
	}, function (notificationId) {});
}

function ciscoSendXmlRequest(uri, request, user, secret) {
	var postParameters = 'XML=' + encodeURIComponent(request).replace(/%20/g, '+');
	var xmlHttp = new XMLHttpRequest();

	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {
			if (!xmlHttp.status) {
				ciscoShowMessage('error_connection_failed');
			}
			else if (xmlHttp.status != 200) {
				ciscoShowMessage('error_dial_failed', [xmlHttp.status, xmlHttp.statusText]);
			}
		}
	};

	xmlHttp.open('POST', uri, true, user, secret);
	xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xmlHttp.send(postParameters);
} 

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.notification) {
		ciscoShowMessage(request.notification);
	}

	if (request.sendxml) {
		ciscoSendXmlRequest(
			request.sendxml.uri,
			request.sendxml.request,
			request.sendxml.user,
			request.sendxml.secret);
	}
});
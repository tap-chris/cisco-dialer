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

var ciscoDialerContentScript = new function () {
	this.listening = false;
	this.tooltip   = null;
	this.delay     = 500;
	this.modified  = [];
	this.skip      = [];
	this.eventName = 'DOMSubtreeModified';
	this.dateExp   = new RegExp(
		'^(([0-3]?[0-9])|([1-9][0-9]{1,3}))' +
		'([.\\/-])[0-3]?[0-9]\\4' +
		'(([0-3]?[0-9])|([1-9][0-9]{1,3}))$');
	this.dontParse = [
		'dial', 'head', 'script', 'noscript', 'style', 'input', 'select',
		'textarea', 'button', 'code', 'img'
	];

	this.numberToRegexp = function (number) {
		return new RegExp(number.replace(
			/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(
				/\s+/g, '([\\s\\u00A0]|&[a-z]+;)+'), 'g');
	};

	this.isDate = function (text) {
		return this.dateExp.test(text);
	};

	this.updateDialLinks = function (rootNode) {
		var links = rootNode.getElementsByTagName('dial');
		var linkCount = links.length;
		
		for (var linkIndex = 0; linkIndex < linkCount; linkIndex++) {
			var phoneNumber = links[linkIndex].getAttribute('number');
			
			links[linkIndex].onmouseover = function (onMouseOverEvent) {
				this.tooltip.assign(onMouseOverEvent.target);
			}.bind(this);
			
			links[linkIndex].onmouseout = function () {
				this.tooltip.hide(this.delay);
			}.bind(this);
		}
	};

	this.removeLinks = function (rootNode) {
		var links = rootNode.getElementsByTagName('dial');
		var linkCount = links.length;
		
		for (var linkIndex = 0; linkIndex < linkCount; linkIndex++) {
			var parentNode = links[linkIndex].parentNode;
			
			if (parentNode !== undefined) {
				parentNode.innerHTML = parentNode.innerHTML.replace(
					/<dial[^>]+>([^<]+)<\/dial>/g, '$1');
			}
		}
	};

	this.parseTextNode = function (node, result) {
		if (node.nodeValue.trim() !== '') {
			var numbers = node.nodeValue.match(
				/([\/=a-z]?\+?[0-9\(\[][0-9\.\-\(\)\[\]\{\}\/\s\u00A0]+[0-9\)\]][:a-z]?)/ig);
			var numberCount = numbers !== null ? numbers.length : 0;
			
			for (var index = 0; index < numberCount; index++) {
				var number = numbers[index].trim();
				if (this.isDate(number)
					|| (number.charAt(0) == '/') || /[:=a-z]/ig.test(number)
					|| (number.replace(/[^0-9]/g, '').length < 3)) {
					continue;
				}
				
				var phoneNumber = new ciscoDialerPhoneNumber(
					number, ciscoDialer.configOptions.countryCode);
				if ((phoneNumber.indexIn(result) < 0) && phoneNumber.valid()) {
					result.push(phoneNumber);
				}
			}
		}
		
		return result;
	};

	this.replaceNumbers = function (node, phoneNumbers) {
		var nodeContent = node.innerHTML;
		for (var numberIndex = 0; numberIndex < phoneNumbers.length; numberIndex++) {
			var phoneNumber = phoneNumbers[numberIndex];
			
			nodeContent = nodeContent.replace(this.numberToRegexp(phoneNumber.rawNumber()),
				'<dial number="' + phoneNumber.clean().toString() + '">$&</dial>');
		}
		
		node.innerHTML = nodeContent;
		this.updateDialLinks(node);
	};

	this.parseNode = function (node) {
		var nodeName = node.nodeName.toLowerCase();
		var childNodes = node.childNodes.length;
		
		if (this.dontParse.indexOf(nodeName) < 0) {
			var phoneNumbers = [];
			for (var nodeIndex = 0; nodeIndex < childNodes; nodeIndex++) {
				var child = node.childNodes[nodeIndex];
				
				if (child.nodeType == Node.TEXT_NODE) {
					phoneNumbers = this.parseTextNode(child, phoneNumbers);
				}
				else {
					this.parseNode(child);
				}
			}
			
			if (phoneNumbers.length > 0) {
				this.skip.push(node);
				this.replaceNumbers(node, phoneNumbers);
			}
		}
	};

	this.parseNodeAsync = function (node) {
		if (this.listening && (this.modified.indexOf(node) < 0)) {
			this.modified.push(node);
			
			setTimeout(function () {
				this.parseNode(node);
				this.modified.splice(this.modified.indexOf(node), 1);
			}.bind(this), 10);
		}
	};

	this.onSubtreeModified = function (subtreeModifiedEvent) {
		if (this.tooltip !== null) {
			this.tooltip.update();
		}
		
		var node = subtreeModifiedEvent.target;
		if (this.skip.indexOf(node) < 0) {
			this.parseNodeAsync(node);
		}
		else {
			this.skip.splice(this.skip.indexOf(node), 1);
		}
	};

	this.onConfigChanged = function (sender) {
		if (!this.listening && sender.canDial()
			&& (sender.configOptions.inPageDial == 'true')) {
			this.listening = true;
			
			if (document.body !== undefined) {
				this.tooltip = new ciscoDialerTooltipContainer(document.body);
				this.parseNodeAsync(document.body);
			}
			
			document.addEventListener(this.eventName,
				this.onSubtreeModified.bind(this), true);
		}
		else if (this.listening && (sender.configOptions.inPageDial == 'false')) {
			this.listening = false;
			
			document.removeEventListener(this.eventName,
				this.onSubtreeModified.bind(this), true);
			this.removeLinks(document.body);
		}
	};

	ciscoDialer.notifyOnChange(this.onConfigChanged.bind(this));
}
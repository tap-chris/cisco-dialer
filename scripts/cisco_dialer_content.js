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
	this.dontParse = ['head', 'script', 'noscript', 'style', 'input', 'select', 'textarea', 'button', 'code', 'img'];

	this.checkParsed = function (node) {
		return (typeof node.className == 'string' ? node.className : '').match(/cisco_parsed/) != null;
	};
	
	this.setParsed = function (node, value) {
		if (value) {
			node.className += (node.className ? ' ' : '') + 'cisco_parsed';
		}
		else {
			node.className = node.className.replace(/\s?cisco_parsed/, '');
		}
	};
	
	this.numberToRegexp = function (number) {
		return new RegExp(number.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '([\\s\\u00A0]|&[a-z]+;)+'));
	};

	this.isDate = function (text) {
		var dateLiMiEndian = '(([0-9]{1,2}[\/\.\-]){2,}([0-9]{2,4})?)';
		var dateBigEndian  = '([0-9]{2,4}([\/\.\-][0-9]{1,2}){2,})';
		var dateTime       = '(([0-9]{2,4}\s+)?[0-9]{1,2}:[0-9]{1,2})';
		
		return text.match(new RegExp('/' + dateLiMiEndian + '|' + dateBigEndian + '|' + dateTime + '/')) != null;
	};

	this.updateDialLinks = function (rootNode) {
		var links = rootNode.getElementsByTagName('dial');
		var linkCount = links.length;
		
		for (var linkIndex = 0; linkIndex < linkCount; linkIndex++) {
			var phoneNumber = links[linkIndex].getAttribute('number');
			
			links[linkIndex].onmouseover = function (onMouseOverEvent) {
				this.tooltip.assign(onMouseOverEvent.target, phoneNumber);
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
			
			if (parentNode != undefined) {
				parentNode.innerHTML = parentNode.innerHTML.replace(/<dial[^>]+>([^<]+)<\/dial>/, '$1');
				this.setParsed(parentNode, false);
			}
		}
	};
	
	this.parseTextNode = function (node) {
		var result = [];
		
		if (node.nodeValue.trim() != '') {
			var numbers = node.nodeValue.match(/(\+?[0-9\(\[][0-9:\.\-\(\)\[\]\{\}\/\s\u00A0]+[0-9\)\]])/g);
			var numberCount = numbers != null ? numbers.length : 0;
			
			for (var index = 0; index < numberCount; index++) {
				var phoneNumber = numbers[index].trim();
				
				if (!this.isDate(phoneNumber) && isValidNumber(phoneNumber, ciscoDialer.configOptions.countryCode)) {
					result.push(phoneNumber);
				}
			}
		}
		
		return result;
	};
		
	this.replaceNumbers = function (node, phoneNumbers) {
		this.setParsed(node, true);
		
		var nodeContent = node.innerHTML;
		for (var numberIndex = 0; numberIndex < phoneNumbers.length; numberIndex++) {
			var phoneNumber = phoneNumbers[numberIndex];
			
			nodeContent = nodeContent.replace(this.numberToRegexp(phoneNumber),
				'<dial number="' + phoneNumber + '">$&</dial>');
		}
		
		node.innerHTML = nodeContent;
		this.updateDialLinks(node);
	};
	
	this.parseNode = function (node) {
		var nodeName = node.nodeName.toLowerCase();
		var childNodes = node.childNodes.length;
		
		if (this.dontParse.indexOf(nodeName) < 0) {
			if (!this.checkParsed(node)) {
				var phoneNumbers = [];
				for (var nodeIndex = 0; nodeIndex < childNodes; nodeIndex++) {
					var child = node.childNodes[nodeIndex];
					
					if (child.nodeType == Node.TEXT_NODE) {
						phoneNumbers = phoneNumbers.concat(this.parseTextNode(child));
					}
					else {
						this.parseNode(child);
					}
				}
				
				if (phoneNumbers.length > 0) {
					this.replaceNumbers(node, phoneNumbers);
				}
			}
		}
	};
		
	this.parseNodeAsync = function (node) {
		if (this.listening) {
			setTimeout(function () {
				this.parseNode(node);
			}.bind(this), 10);
		}
	};
	
	this.onNodeChanged = function (nodeChangedEvent) {
		this.parseNodeAsync(nodeChangedEvent.relatedNode ? nodeChangedEvent.relatedNode : nodeChangedEvent.target);
	};
	
    this.onConfigChanged = function (sender) {
        if (!this.listening && sender.canDial() && (sender.configOptions.inPageDial == 'true')) {
			this.listening = true;
			
			if (document.body != undefined) {
				this.tooltip = new ciscoDialerTooltipContainer(document.body);
				this.parseNodeAsync(document.body);
			}
			
			document.addEventListener('DOMNodeInserted', this.onNodeChanged.bind(this), true);
			document.addEventListener('DOMCharacterDataModified', this.onNodeChanged.bind(this), true);
        }
		else if (this.listening && (sender.configOptions.inPageDial == 'false')) {
			this.listening = false;
			this.removeLinks(document.body);
		}
    };

    ciscoDialer.notifyOnChange(this.onConfigChanged.bind(this));
}

function ciscoDialerTooltipContainer (parent) {
	this.timeout = false;
	this.tooltip = null;
		
	this.getOffsetRect = function (element) {
		var box = element.getBoundingClientRect();
		var body = document.body;
		var docElement = document.documentElement;
		
		var top  = box.top
			+ (window.pageYOffset || docElement.scrollTop || body.scrollTop)
			- (docElement.clientTop || body.clientTop || 0);
		var left = box.left
			+ (window.pageXOffset || docElement.scrollLeft || body.scrollLeft)
			- (docElement.clientLeft || body.clientLeft || 0);
			
		return { top: Math.round(top), left: Math.round(left) };
	};		
		
	this.setState = function (state) {
		this.tooltip.setAttribute('class', 'cisco_tooltip cisco_' + state);
	};
		
	this.reset = function () {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = false;
		}
	};
		
	this.hide = function (delay) {
		if (typeof delay == 'number') {
			this.timeout = setTimeout(this.hide.bind(this), delay);
		}
		else {
			this.setState('hidden');
		}
	};
		
	this.show = function () {
		this.reset();
		this.setState('hover');
	};
		
	this.assign = function (target, phoneNumber) {
		this.reset();
		
		var rect = this.getOffsetRect(target);
		
		with (this.tooltip) {
			style.top = (rect.top - 2) + 'px';
			style.left = (rect.left + target.offsetWidth + 2) + 'px';
			style.height = (target.offsetHeight) + 'px';
			style.width = (target.offsetHeight) + 'px';				
			setAttribute('class', 'cisco_tooltip');
		}
		
		this.tooltip.onclick = function (onClickEvent) {
			new ciscoDialerPhoneNumber(phoneNumber).dial();
			this.hide();
		}.bind(this);
	};

	this.populate = function (parent) {
		if (this.tooltip == null) {
			this.tooltip = document.createElement('div');
			
			with (this.tooltip) {
				setAttribute('class', 'cisco_tooltip cisco_hidden');
				setAttribute('role', 'tooltip');		
				onmouseover = this.show.bind(this);
				onmouseout = this.hide.bind(this);
			}
			
			parent.appendChild(this.tooltip);
		}
	};
	
	this.populate(parent);
}
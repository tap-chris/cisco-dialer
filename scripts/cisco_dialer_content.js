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
var ciscoDialerContentScript = new function () {
    this.listening = false;
	this.tooltip   = null;
	this.dontParse = ['head', 'script', 'noscript', 'style', 'input', 'select', 'textarea', 'button', 'code', 'img'];

	this.checkParsed = function (node) {
		return (typeof node.className == 'string' ? node.className : '').match(/cisco_parsed/) != null;
	};
	
	this.setParsed = function (node) {
		node.className += (node.className ? ' ' : '') + 'cisco_parsed';
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
	}

	this.updateDialLinks = function (rootNode, className) { // FIXME: cleanup
		var links = rootNode.getElementsByClassName(className);
		var linkCount = links.length;
		
		for (var linkIndex = 0; linkIndex < linkCount; linkIndex++) {
			var phoneNumber = links[linkIndex].getAttribute('cisco-dial');
						
			links[linkIndex].onmouseover = function (onMouseOverEvent) {
				var rect = this.getOffsetRect(onMouseOverEvent.target);
			    
				this.tooltip.style.top = (rect.top - 2) + 'px';
				this.tooltip.style.left = (rect.left + onMouseOverEvent.target.offsetWidth + 2) + 'px';
				this.tooltip.style.height = (onMouseOverEvent.target.offsetHeight) + 'px';
				this.tooltip.style.width = (onMouseOverEvent.target.offsetHeight) + 'px';				
				this.tooltip.setAttribute('class', 'cisco_tooltip');
				
				this.tooltip.onclick = function (onClickEvent) {
					new ciscoDialerPhoneNumber(phoneNumber).dial();
					this.tooltip.setAttribute('class', 'cisco_tooltip cisco_hidden');
				}.bind(this);

				this.tooltip.onmouseover = function (onMouseOverEvent) {
					this.tooltip.setAttribute('class', 'cisco_tooltip cisco_hover');
				}.bind(this);

				this.tooltip.onmouseout = function (onMouseOutEvent) {
					this.tooltip.setAttribute('class', 'cisco_tooltip cisco_hidden');
				}.bind(this);
			}.bind(this);
			
			links[linkIndex].onmouseout = function (onMouseOutEvent) {
				this.tooltip.setAttribute('class', 'cisco_tooltip cisco_hidden');
			}.bind(this);
		}
	};
	
	this.removeLinks = function (rootNode, className) {
		// FIXME: Remove the links again
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
		this.setParsed(node);
		
		var nodeContent = node.innerHTML;
		for (var numberIndex = 0; numberIndex < phoneNumbers.length; numberIndex++) {
			var phoneNumber = phoneNumbers[numberIndex];
			
			nodeContent = nodeContent.replace(this.numberToRegexp(phoneNumber),
				'<span class="cisco_link" cisco-dial="' + phoneNumber + '">$&</span>');
		}
		
		node.innerHTML = nodeContent;
		this.updateDialLinks(node, 'cisco_link');
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
	
	this.addTooltipContainer = function (parent) {
		this.tooltip = document.createElement('div');
		this.tooltip.setAttribute('class', 'cisco_tooltip cisco_hidden');
		this.tooltip.setAttribute('role', 'tooltip');
		
		parent.appendChild(this.tooltip);
	};
	
    this.onConfigChanged = function (sender) {
        if (!this.listening && sender.canDial() && (sender.configOptions.inPageDial == 'true')) {
			this.listening = true;
			
			if (document.body != undefined) {
				this.addTooltipContainer(document.body);
				this.parseNodeAsync(document.body);
			}
			
			document.addEventListener('DOMNodeInserted', this.onNodeChanged.bind(this), true);
			document.addEventListener('DOMCharacterDataModified', this.onNodeChanged.bind(this), true);
			// DOMContentLoaded
        }
		else if (this.listening && (sender.configOptions.inPageDial == 'false')) {
			this.listening = false;
			this.removeLinks(document.body, 'cisco_link');
		}
    };

    ciscoDialer.notifyOnChange(this.onConfigChanged.bind(this));
}
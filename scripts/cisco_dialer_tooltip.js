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

function ciscoDialerTooltipContainer (parent) {
	this.timeout  = false;
	this.tooltip  = null;
	this.parent   = null;
	this.fixed    = false;
	this.useFixed = [
		'^https?:\\/\\/www.google\\.[a-z]+\\/(search\\?q=)|(.*#q=)'
	];

	this.setState = function (state) {
		this.tooltip.setAttribute('class', 
			'cisco_tooltip cisco_' + (this.fixed ? 'fixed' : 'absolute')
			+ (state != 'visible' ? ' cisco_' + state : ''));			
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

	this.getOffsetRect = function (element) {
		var elementBox = element.getBoundingClientRect();
		var docBody    = document.body;
		var docElement = document.documentElement;
		
		var top = elementBox.top
				+ (window.pageYOffset || docElement.scrollTop || docBody.scrollTop)
				- (docElement.clientTop || docBody.clientTop || 0);
		var left = elementBox.left
				+ (window.pageXOffset || docElement.scrollLeft || docBody.scrollLeft)
				- (docElement.clientLeft || docBody.clientLeft || 0);
		
		return {
			top: Math.round(top),
			left: Math.round(left)
		};
	};
	
	this.update = function () {
		if (this.parent !== null) {
			if (this.fixed) {
				var rect = this.parent.getBoundingClientRect();
			}
			else {			
                var rect = this.getOffsetRect(this.parent);
			}        
			
			this.tooltip.style.top = rect.top + 'px';	
			this.tooltip.style.left = (rect.left + this.parent.offsetWidth + 2) + 'px';
			this.tooltip.style.height = this.parent.offsetHeight + 'px';
			this.tooltip.style.width = this.parent.offsetHeight + 'px';
		}
	}

	this.assign = function (target) {
		this.reset();
		
		if (target.nodeName == 'DIAL') {
			this.setState('hidden');
			
			if (this.fixed) {
				target.appendChild(this.tooltip);
			}
			
			var phoneNumber = new ciscoDialerPhoneNumber(
				target.getAttribute('number')).format(
					ciscoDialer.configOptions.countryCode);
			
			this.parent = target;			
			this.update();
			
			this.tooltip.setAttribute('title',
				chrome.i18n.getMessage('dial_label', phoneNumber.toString()));		
			this.tooltip.onclick = function (onClickEvent) {
				phoneNumber.dial();
				this.hide();
			}.bind(this);
			
			this.setState('visible');
		}
	};

	this.locationChanged = function () {
		this.fixed = this.useFixed.some(function (regString) {
			return (new RegExp(regString)).test(location.href);
		});
 	};

	this.populate = function (parent) {
		if (this.tooltip === null) {
			this.tooltip = document.createElement('div');
			
			this.locationChanged();
			this.setState('hidden');
			
			this.tooltip.setAttribute('role', 'tooltip');
			this.tooltip.onmouseover = this.show.bind(this);
			this.tooltip.onmouseout = this.hide.bind(this);
			
			parent.appendChild(this.tooltip);
			
			window.addEventListener('scroll', this.update.bind(this));
			window.addEventListener('hashchange', this.locationChanged.bind(this));
		}
	};

	this.populate(parent);
}
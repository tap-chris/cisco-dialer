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
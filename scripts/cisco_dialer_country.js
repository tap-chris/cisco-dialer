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

var ciscoDialerCountryHelper = new function () {
	this.countryList = [
		{ code: 'AF' }, { code: 'AL' }, { code: 'DZ' }, { code: 'AS' }, { code: 'AD' },
		{ code: 'AO' }, { code: 'AI' }, { code: 'AQ' }, { code: 'AG' }, { code: 'AR' },
		{ code: 'AM' }, { code: 'AW' }, { code: 'AC' }, { code: 'AU' }, { code: 'AT' },
		{ code: 'AZ' }, { code: 'BS' }, { code: 'BH' }, { code: 'BD' }, { code: 'BB' },
		{ code: 'BY' }, { code: 'BE' }, { code: 'BZ' }, { code: 'BJ' }, { code: 'BM' },
		{ code: 'BT' }, { code: 'BO' }, { code: 'BA' }, { code: 'BW' }, { code: 'BV' },
		{ code: 'BR' }, { code: 'IO' }, { code: 'BN' }, { code: 'BG' }, { code: 'BF' },
		{ code: 'BI' }, { code: 'KH' }, { code: 'CM' }, { code: 'CA' }, { code: 'CV' },
		{ code: 'KY' }, { code: 'CF' }, { code: 'TD' }, { code: 'CL' }, { code: 'CN' },
		{ code: 'CX' }, { code: 'CC' }, { code: 'CO' }, { code: 'KM' }, { code: 'CG' },
		{ code: 'CK' }, { code: 'CR' }, { code: 'CI' }, { code: 'HR' }, { code: 'CU' },
		{ code: 'CY' }, { code: 'CZ' }, { code: 'CD' }, { code: 'DK' }, { code: 'DJ' },
		{ code: 'DM' }, { code: 'DO' }, { code: 'TL' }, { code: 'EC' }, { code: 'EG' },
		{ code: 'SV' }, { code: 'GQ' }, { code: 'ER' }, { code: 'EE' }, { code: 'ET' },
		{ code: 'FK' }, { code: 'FO' }, { code: 'FJ' }, { code: 'FI' }, { code: 'FR' },
		{ code: 'FX' }, { code: 'GF' }, { code: 'PF' }, { code: 'TF' }, { code: 'GA' },
		{ code: 'GM' }, { code: 'GE' }, { code: 'DE' }, { code: 'GH' }, { code: 'GI' },
		{ code: 'GR' }, { code: 'GL' }, { code: 'GD' }, { code: 'GP' }, { code: 'GU' },
		{ code: 'GT' }, { code: 'GN' }, { code: 'GW' }, { code: 'GY' }, { code: 'HT' },
		{ code: 'HM' }, { code: 'HN' }, { code: 'HK' }, { code: 'HU' }, { code: 'IS' },
		{ code: 'IN' }, { code: 'ID' }, { code: 'IR' }, { code: 'IQ' }, { code: 'IE' },
		{ code: 'IM' }, { code: 'IL' }, { code: 'IT' }, { code: 'JM' }, { code: 'JP' },
		{ code: 'JO' }, { code: 'KZ' }, { code: 'KE' }, { code: 'KI' }, { code: 'KW' },
		{ code: 'KG' }, { code: 'LA' }, { code: 'LV' }, { code: 'LB' }, { code: 'LS' },
		{ code: 'LR' }, { code: 'LY' }, { code: 'LI' }, { code: 'LT' }, { code: 'LU' },
		{ code: 'MO' }, { code: 'MK' }, { code: 'MG' }, { code: 'MW' }, { code: 'MY' },
		{ code: 'MV' }, { code: 'ML' }, { code: 'MT' }, { code: 'MH' }, { code: 'MQ' },
		{ code: 'MR' }, { code: 'MU' }, { code: 'YT' }, { code: 'MX' }, { code: 'FM' },
		{ code: 'MD' }, { code: 'MC' }, { code: 'MN' }, { code: 'ME' }, { code: 'MS' },
		{ code: 'MA' }, { code: 'MZ' }, { code: 'MM' }, { code: 'NA' }, { code: 'NR' },
		{ code: 'NP' }, { code: 'NL' }, { code: 'AN' }, { code: 'NC' }, { code: 'NZ' },
		{ code: 'NI' }, { code: 'NE' }, { code: 'NG' }, { code: 'NU' }, { code: 'NF' },
		{ code: 'KP' }, { code: 'MP' }, { code: 'NO' }, { code: 'OM' }, { code: 'PK' },
		{ code: 'PW' }, { code: 'PS' }, { code: 'PA' }, { code: 'PG' }, { code: 'PY' },
		{ code: 'PE' }, { code: 'PH' }, { code: 'PN' }, { code: 'PL' }, { code: 'PT' },
		{ code: 'PR' }, { code: 'QA' }, { code: 'RE' }, { code: 'RO' }, { code: 'RU' },
		{ code: 'RW' }, { code: 'SH' }, { code: 'KN' }, { code: 'LC' }, { code: 'PM' },
		{ code: 'VC' }, { code: 'SM' }, { code: 'ST' }, { code: 'SA' }, { code: 'SN' },
		{ code: 'RS' }, { code: 'SC' }, { code: 'SL' }, { code: 'SG' }, { code: 'SK' },
		{ code: 'SI' }, { code: 'SB' }, { code: 'SO' }, { code: 'ZA' }, { code: 'GS' },
		{ code: 'KR' }, { code: 'ES' }, { code: 'LK' }, { code: 'SD' }, { code: 'SR' },
		{ code: 'SJ' }, { code: 'SZ' }, { code: 'SE' }, { code: 'CH' }, { code: 'SY' },
		{ code: 'TW' }, { code: 'TJ' }, { code: 'TZ' }, { code: 'TH' }, { code: 'TG' },
		{ code: 'TK' }, { code: 'TO' }, { code: 'TT' }, { code: 'TN' }, { code: 'TR' },
		{ code: 'TM' }, { code: 'TC' }, { code: 'TV' }, { code: 'UG' }, { code: 'UA' },
		{ code: 'AE' }, { code: 'GB' }, { code: 'US' }, { code: 'UM' }, { code: 'UY' },
		{ code: 'UZ' }, { code: 'VU' }, { code: 'VA' }, { code: 'VE' }, { code: 'VN' },
		{ code: 'VG' }, { code: 'VI' }, { code: 'WF' }, { code: 'EH' }, { code: 'WS' },
		{ code: 'YE' }, { code: 'YU' }, { code: 'ZM' }, { code: 'ZW' }
	];

	this.replaceUmlauts = function (name) {
		var umlauts = { 'ä': 'a', 'ü': 'u', 'ö': 'o', 'ß': 'ss' };
		return name.replace(/[äöüß]/g, function ($0) { return umlauts[$0]; });
	};

	this.getName = function (forCode) {
		return chrome.i18n.getMessage('country_code_' + forCode);
	};

	this.loadNames = function () {
		for (var index = 0, size = this.countryList.length; index < size; index++) {
			this.countryList[index].name = this.getName(this.countryList[index].code);
		}
		
		this.countryList.sort(function (left, right) {
			var leftName = this.replaceUmlauts(left.name.toLowerCase());
			var rightName = this.replaceUmlauts(right.name.toLowerCase());
			
			return leftName < rightName ? -1 : leftName > rightName ? 1 : 0;
		}.bind(this));
	};

	this.forEach = function (callback, namespace) {
		this.countryList.forEach(callback, namespace);
	};

	this.loadNames();
}
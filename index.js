/**
* index.js
* Entry point into hover-api-promise, API-compatible with (and based on) 
* hover-api by Steven White, but promisified.
*
* Author: Jesse Dyck, 2018
* Kudos: Steven White (https://github.com/swhite24/hover-api)
* Kudos: Dan Krause (https://gist.github.com/dankrause/5585907)
*/

const rp = require('request-promise-native'),
	_ = require('lodash');

class hoverAPI {
	constructor (user, pass) {
		if ('string' != typeof user)
			throw new Error('Please specify a username.');
		
		if ('string' != typeof pass)
			throw new Error('Please specify a password.');
		
		/*global process*/
		this._debug = process.env.HOVERAPIDEBUG;
		this._log('Setting up API');
		
		this._user = user;
		this._pass = pass;
		this._baseUrl = 'https://www.hover.com/api';
		
		// Captured from cookie in hover authentication request.
		this._cookies = rp.jar();
		
		// Create request wrapper, enabling json and cookies
		this._rp = rp.defaults({
			jar: this._cookies,
			json: true
		});
		
		// Store promise for use in chaining later; each API call
		// will chain off this to ensure we're logged in first.
		// This will start running but not actually fulfill until after the 
		// constructor has exited. 
		this._loggedInPromise = this._login();
	}
	
	/**
	* Authenticate, storing cookies in the jar
	*
	* @api private
	*/
	_login () {
		return this._rp({
			uri: this._baseUrl + '/login',
			form: {username: this._user, password: this._pass},
			method: 'POST'
		})
			.then (() => {
				this._log('Logged in');
				return Promise.resolve();
			})
			.catch ( err => {
				throw new Error('Log in error: ' + err.statusCode + ' - ' + err.error.error);
			});
	}
	
	/**
	* Retrieve list of all domains in account
	*
	* @api public
	*/
	getAllDomains () {
		return this._hoverRequest({uri: '/domains'});
	}
	
	/**
	* Retrieve list of all dns records in account
	*
	* @api public
	*/
	getAllDns () {
		return this._hoverRequest({uri: '/dns'});
	}
	
	/**
	* Retrieve individual domain in account
	*
	* @param {String} domain Domain identifier
	* @api public
	*/
	getDomain (domain) {
		return this._hoverRequest({uri: '/domains/' + domain});
	}
	
	/**
	* Retrieve list of all dns records for particular domain
	*
	* @param {String} domain Domain identifier
	* @api public
	*/
	getDomainDns (domain) {
		return this._hoverRequest({uri: '/domains/' + domain + '/dns'});
	}
	
	/**
	* Create a new A record under the specified domain
	*
	* @param {String} domain Domain identifier
	* @param {String} subdomain Subdomain of record
	* @param {String} ip IP Address of record
	* @api public
	*/
	createARecord (domain, subdomain, ip) {
		var req = {
			method: 'POST',
			uri: '/domains/' + domain + '/dns',
			body: {
				name: subdomain,
				type: 'A',
				content: ip
			}
		};
		
		return this._hoverRequest(req);
	}
	
	/**
	* Create a new MX record under the specified domain
	*
	* @param {String} domain Domain identifier
	* @param {String} subdomain Subdomain of record
	* @param {String} priority Priority of record
	* @param {String} ip IP Address of record
	* @api public
	*/
	createMXRecord (domain, subdomain, priority, ip) {
		var req = {
			method: 'POST',
			uri: '/domains/' + domain + '/dns',
			body: {
				name: subdomain,
				type: 'MX',
				content: [priority, ip].join(' ')
			}
		};
		
		return this._hoverRequest(req);
	}
	
	/**
	* Update an existing domain record
	*
	* @param {String} dns DNS identifier
	* @param {String} ip New IP Address of record
	* @api public
	*/
	updateDomainDns (dns, ip) {
		var req = {
			method: 'PUT',
			uri: '/dns/' + dns,
			body: {
				content: ip
			}
		};
		
		return this._hoverRequest(req);
	}
	
	/**
	* Remove an existing dns record
	*
	* @param {String} dns DNS identifier
	* @api public
	*/
	removeDns (dns) {
		return this._hoverRequest({method: 'DELETE', uri: '/dns/' + dns});
	}
	
	/**
	* Proxy request to hover API. Relies on previously-started
	* login promise.
	* Prepends baseUrl to the supplied uri in the req object.
	*
	* @param {Object} req Parameters for HTTP request
	* @api private
	*/
	_hoverRequest (req) {
		req.uri = this._baseUrl + req.uri;
		
		this._log('Compiled request:');
		this._log(req);
		
		// Use previously-completed promise to ensure we're logged in
		return this._loggedInPromise
			.then(() => {
				this._log('Sending request.');
				return this._rp(req);
			})
			.then (data => {
				this._log('Got response:');
				this._log(data);
				_.unset(data, 'succeeded');
				
				return Promise.resolve(_.toArray(data));
			})
			.catch ( err => {
				return Promise.reject(err.message);
			});
	}
	
	/**
	* Logs messages to the console if the HOVERAPIDEBUG environment
	* variable is set to 1
	*
	* @param {Mixed} message Message to send to console
	* @api private
	*/
	_log (message) {
		// Assumes a value of 1 in terminal is truthy
		if (this._debug == true) 
			console.log(message);
	}
}

module.exports = hoverAPI;
'use strict';
exports.__esModule = true;
exports.Client = void 0;
var _axios = require('axios');
var fetchAdapter = require('@haverstack/axios-fetch-adapter');
var pkg = require('../../package.json');
// const {
//   helpers: {
//     mergeData,
//   },
//   classes: {
//     Response,
//     ResponseError,
//   },
// } = require('@sendgrid/helpers');
var _a = require('@sendgrid/helpers'), helpers = _a.helpers, classes = _a.classes;
var axios = _axios.create({
    adapter: fetchAdapter
});
var API_KEY_PREFIX = 'SG.';
var SENDGRID_BASE_URL = 'https://api.sendgrid.com/';
var TWILIO_BASE_URL = 'https://email.twilio.com/';
var Client = /** @class */ (function () {
    function Client() {
        this.auth = '';
        this.impersonateSubuser = '';
        this.defaultHeaders = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'sendgrid/' + pkg.version + ';nodejs'
        };
        this.defaultRequest = {
            baseUrl: SENDGRID_BASE_URL,
            url: '',
            method: 'GET',
            headers: {},
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        };
    }
    Client.prototype.setApiKey = function (apiKey) {
        this.auth = 'Bearer ' + apiKey;
        this.setDefaultRequest('baseUrl', SENDGRID_BASE_URL);
        if (!this.isValidApiKey(apiKey)) {
            console.warn("API key does not start with \"" + API_KEY_PREFIX + "\".");
        }
    };
    Client.prototype.setTwilioEmailAuth = function (username, password) {
        var b64Auth = Buffer.from(username + ':' + password).toString('base64');
        this.auth = 'Basic ' + b64Auth;
        this.setDefaultRequest('baseUrl', TWILIO_BASE_URL);
        if (!this.isValidTwilioAuth(username, password)) {
            console.warn('Twilio Email credentials must be non-empty strings.');
        }
    };
    Client.prototype.isValidApiKey = function (apiKey) {
        return this.isString(apiKey) && apiKey.trim().startsWith(API_KEY_PREFIX);
    };
    Client.prototype.isValidTwilioAuth = function (username, password) {
        return this.isString(username) && username
            && this.isString(password) && password;
    };
    Client.prototype.isString = function (value) {
        return typeof value === 'string' || value instanceof String;
    };
    Client.prototype.setImpersonateSubuser = function (subuser) {
        this.impersonateSubuser = subuser;
    };
    Client.prototype.setDefaultHeader = function (key, value) {
        if (key !== null && typeof key === 'object') {
            // key is an object
            Object.assign(this.defaultHeaders, key);
            return this;
        }
        this.defaultHeaders[key] = value;
        return this;
    };
    Client.prototype.setDefaultRequest = function (key, value) {
        if (key !== null && typeof key === 'object') {
            // key is an object
            Object.assign(this.defaultRequest, key);
            return this;
        }
        this.defaultRequest[key] = value;
        return this;
    };
    Client.prototype.createHeaders = function (data) {
        // Merge data with default headers.
        var headers = helpers.mergeData(this.defaultHeaders, data);
        // Add auth, but don't overwrite if header already set.
        if (typeof headers.Authorization === 'undefined' && this.auth) {
            headers.Authorization = this.auth;
        }
        if (this.impersonateSubuser) {
            headers['On-Behalf-Of'] = this.impersonateSubuser;
        }
        return headers;
    };
    Client.prototype.createRequest = function (data) {
        var options = {
            url: data.uri || data.url,
            baseUrl: data.baseUrl,
            method: data.method,
            data: data.body,
            params: data.qs,
            headers: data.headers
        };
        // Merge data with default request.
        options = helpers.mergeData(this.defaultRequest, options);
        options.headers = this.createHeaders(options.headers);
        options.baseURL = options.baseUrl;
        delete options.baseUrl;
        return options;
    };
    Client.prototype.request = function (data, cb) {
        data = this.createRequest(data);
        var promise = new Promise(function (resolve, reject) {
            axios(data)
                .then(function (response) {
                return resolve([
                    new classes.Response(response.status, response.data, response.headers),
                    response.data,
                ]);
            })["catch"](function (error) {
                if (error.response) {
                    if (error.response.status >= 400) {
                        return reject(new classes.ResponseError(error.response));
                    }
                }
                return reject(error);
            });
        });
        // Throw an error in case a callback function was not passed.
        if (cb && typeof cb !== 'function') {
            throw new Error('Callback passed is not a function.');
        }
        if (cb) {
            return promise
                .then(function (result) { return cb(null, result); })["catch"](function (error) { return cb(error, null); });
        }
        return promise;
    };
    return Client;
}());
exports.Client = Client;

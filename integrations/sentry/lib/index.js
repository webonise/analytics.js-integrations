'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var foldl = require('@ndhoule/foldl');
/**
 * Expose `Sentry` integration.
 */

var Sentry = (module.exports = integration('Sentry')
  .option('config', '')
  .option('serverName', null)
  .option('release', null)
  .option('ignoreErrors', [])
  .option('ignoreUrls', [])
  .option('whitelistUrls', [])
  .option('maxMessageLength', null)
  .option('logger', null)
  .option('customVersionProperty', null)
  .tag(
    '<script src="https://browser.sentry-cdn.com/5.7.1/bundle.min.js" integrity="sha384-KMv6bBTABABhv0NI+rVWly6PIRvdippFEgjpKyxUcpEmDWZTkDOiueL5xW+cztZZ" crossorigin="anonymous"></script>'
  ));

/**
 * Initialize.
 *
 * https://docs.sentry.io/clients/javascript/config/
 * https://github.com/getsentry/raven-js/blob/3.12.1/src/raven.js#L646-L649
 * @api public
 */

Sentry.prototype.initialize = function() {
  var dsnPublic = this.options.config;
  var customRelease = this.options.customVersionProperty
    ? window[this.options.customVersionProperty]
    : null;
  var options = {
    environment: this.options.logger,
    release: customRelease || this.options.release,
    serverName: this.options.serverName,
    whitelistUrls: this.options.whitelistUrls,
    ignoreErrors: this.options.ignoreErrors,
    blacklistUrls: this.options.ignoreUrls,
    // includePaths: this.options.includePaths,
    maxMessageLength: this.options.maxMessageLength
  };

  // window.RavenConfig = {
  //   dsn: dsnPublic,
  //   config: reject(options)
  // };
  var self = this;
  this.load(function() {
    self.ready();
    window.Sentry.onLoad(function() {
      var initiOptions = reject(options);
      initiOptions.dsn = dsnPublic;
      window.Sentry.init(initiOptions);
    });
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Sentry.prototype.loaded = function() {
  return is.object(window.Sentry);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Sentry.prototype.identify = function(identify) {
  // window.Raven.setUserContext(identify.traits());
  window.Sentry.setUser(identify.traits());
};

/**
 * Set tag to events for easy categorization.
 *
 * @api public
 * @param {Tag Key} tagKey
 * @param {Tag Value} tagValue
 */

Sentry.prototype.setTag = function(tagKey, tagValue) {
  window.Sentry.setTag(tagKey, tagValue);
};

/**
 * Set Event severity level.
 * One of: fatal, error, warning, info, debug
 * @api public
 * @param {Event Severity Level} level
 */

Sentry.prototype.setLevel = function(level) {
  window.Sentry.configureScope(function(scope) {
    scope.setLevel(level);
  });
};

/**
 * Clean out null values
 */

function reject(obj) {
  return foldl(
    function(result, val, key) {
      var payload = result;

      // strip any null or empty string values
      if (val !== null && val !== '' && !is.array(val)) {
        payload[key] = val;
      }
      // strip any empty arrays
      if (is.array(val)) {
        var ret = [];
        // strip if there's only an empty string or null in the array since the settings UI lets you save additional rows even though some may be empty strings
        for (var x = 0; x < val.length; x++) {
          if (val[x] !== null && val[x] !== '') ret.push(val[x]);
        }
        if (!is.empty(ret)) {
          payload[key] = ret;
        }
      }
      return payload;
    },
    {},
    obj
  );
}

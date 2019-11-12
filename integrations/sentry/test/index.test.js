'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Sentry = require('../lib/');

describe('Sentry', function() {
  var sentry;
  var analytics;
  var options = {
    config: 'https://8152fdb57e8c4ec1b60d27745bda8cbd@sentry.io/52723',
    logger: 'development',
    release: '28d497fb8af6cc3efbe160e28c1c08f08bd688fc',
    serverName: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
    whitelistUrls: ['/getsentry.com/', 'segment.com'],
    ignoreErrors: ['fb_xd_fragment'],
    ignoreUrls: ['/graph.facebook.com/', 'http://example.com/script2.js'],
    // includePaths: ['/https?://getsentry.com/', '/https?://cdn.getsentry.com/'],
    // maxMessageLength: 50,
    tagSetting: null,
    eventSeverity: 'error',
    customVersionProperty: null
  };

  beforeEach(function() {
    analytics = new Analytics();
    sentry = new Sentry(options);
    analytics.use(Sentry);
    analytics.use(tester);
    analytics.add(sentry);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sentry.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Sentry,
      integration('Sentry')
        .option('config', '')
        .option('serverName', null)
        .option('release', null)
        .option('ignoreErrors', [])
        .option('ignoreUrls', [])
        .option('whitelistUrls', [])
        .option('logger', null)
        .option('customVersionProperty', null)
        .option('tagSetting', null)
        .option('eventSeverity', null)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(sentry, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(sentry.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(sentry, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.Sentry, 'setUser');
        analytics.stub(window.Sentry, 'captureException');
        analytics.stub(window.Sentry, 'setTag');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.Sentry.setUser, { id: 'id' });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.Sentry.setUser, { trait: true });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.Sentry.setUser, {
          id: 'id',
          trait: true
        });
      });

      it('should capture error event', function() {
        try {
          // eslint-disable-next-line no-undef
          aFunctionThatMightFail();
        } catch (err) {
          window.Sentry.captureException(err);
        }
        analytics.called(window.Sentry.captureException);
      });
    });
  });
});

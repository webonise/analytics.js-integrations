'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Pinterest = require('../lib/');

describe('Pinterest', function() {
  var analytics;
  var pinterest;
  var options = {
    tid: '2620795819800',
    pinterestEventMapping: {
      'Some Custom Event': 'Custom',
      'Lead Generated': 'Lead',
      'User Signed Up': 'Signup'
    },
    pinterestCustomProperties: ['custom_prop'],
    useEnhancedMatchLoad: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    pinterest = new Pinterest(options);
    analytics.use(Pinterest);
    analytics.use(tester);
    analytics.add(pinterest);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    pinterest.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Pinterest,
      integration('Pinterest Tag')
        .global('pintrk')
        .mapping('pinterestEventMapping')
        .option('pinterestCustomProperties', [])
        .option('tid', '')
        .option('useEnhancedMatchLoad', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(pinterest, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(pinterest.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(pinterest, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.stub(pinterest, 'load');
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(window, 'pintrk');
      });

      it('should not fire the Pinterest pixel tag', function() {
        analytics.identify();
        analytics.didNotCall(window.pintrk);
      });

      it('should set Segment email to Pinterest Enhanced Match', function() {
        analytics.identify('123', { email: 'prakash@segment.com' });
        analytics.called(window.pintrk, 'set', {
          np: 'segment',
          em: 'prakash@segment.com'
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'pintrk');
      });

      it('should track product viewed as page viewed', function() {
        analytics.track('Product Viewed', {
          id: '507f1f77bcf86cd799439011',
          name: 'Monopoly: 3rd Edition',
          price: 18.99
        });

        analytics.called(window.pintrk, 'track', 'PageVisit', {
          line_items: [
            {
              product_name: 'Monopoly: 3rd Edition',
              product_price: 18.99
            }
          ]
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'pintrk');
      });

      it('should track pagevisit for named page view', function() {
        analytics.page('Page1');

        analytics.called(window.pintrk, 'track', 'PageVisit', {
          name: 'Page1'
        });
      });

      it('should track viewcategory for categorised page view', function() {
        analytics.page('Page1', 'Category');

        analytics.called(window.pintrk, 'track', 'ViewCategory', {
          category: 'Page1',
          name: 'Category'
        });
      });
    });
  });
});

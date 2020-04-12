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

      it('should track custom event mapped under pinterestEventMapping mapping', function() {
        analytics.track('User Signed Up');
        analytics.called(window.pintrk, 'track', 'Signup');
      });

      it('should track product searched', function() {
        analytics.track('Products Searched', { query: 'product1' });
        analytics.called(window.pintrk, 'track', 'Search', {
          search_query: 'product1'
        });
      });

      it('should track product list filtered', function() {
        analytics.track('Product List Filtered', {
          category: 'cat 1'
        });
        analytics.called(window.pintrk, 'track', 'Search', {
          line_items: [
            {
              product_category: 'cat 1'
            }
          ]
        });
      });

      it('should track product added', function() {
        analytics.track('Product Added', {
          product_id: '507f1f77bcf86cd799439011',
          currency: 'USD',
          quantity: 1,
          price: 44.33,
          name: 'my product',
          category: 'cat 1',
          sku: 'p-298',
          value: 24.75
        });

        analytics.called(window.pintrk, 'track', 'AddToCart', {
          value: 24.75,
          currency: 'USD',
          line_items: [
            {
              product_name: 'my product',
              product_id: 'p-298',
              product_category: 'cat 1',
              product_price: 44.33,
              product_quantity: 1
            }
          ]
        });
      });

      it('should tracks order completed', function() {
        analytics.track('Order Completed', {
          order_id: '50314b8e9bcf000000000000',
          total: 30,
          revenue: 25,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games'
            },
            {
              product_id: '505bd76785ebb509fc183733',
              sku: '46493-32',
              name: 'Uno Card Game',
              price: 3,
              quantity: 2,
              category: 'Games'
            }
          ]
        });

        analytics.called(window.pintrk, 'track', 'Checkout', {
          order_id: '50314b8e9bcf000000000000',
          coupon: 'hasbros',
          currency: 'USD',
          line_items: [
            {
              product_name: 'Monopoly: 3rd Edition',
              product_id: '45790-32',
              product_category: 'Games',
              product_price: 19,
              product_quantity: 1
            },
            {
              product_name: 'Uno Card Game',
              product_id: '46493-32',
              product_category: 'Games',
              product_price: 3,
              product_quantity: 2
            }
          ]
        });
      });

      it('should track video playback started', function() {
        analytics.track('Video Playback Started');
        analytics.called(window.pintrk, 'track', 'WatchVideo');
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

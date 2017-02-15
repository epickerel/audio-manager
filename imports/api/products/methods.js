import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { _ } from 'meteor/underscore';

import { Products } from './products.js';

const PRODUCT_ID_ONLY = new SimpleSchema({
  productId: { type: String },
}).validator();

export const insert = new ValidatedMethod({
  name: 'products.insert',
  validate: new SimpleSchema({
    locale: {
      type: String,
    },
  }).validator(),
  run({ locale }) {
    return Products.insert({}, null, locale);
  },
});

export const makePrivate = new ValidatedMethod({
  name: 'products.makePrivate',
  validate: PRODUCT_ID_ONLY,
  run({ productId }) {
    if (!this.userId) {
      throw new Meteor.Error('api.products.makePrivate.notLoggedIn',
        'Must be logged in to make private products.');
    }

    const product = Products.findOne(productId);

    if (product.isLastPublicProduct()) {
      throw new Meteor.Error('api.products.makePrivate.lastPublicProduct',
        'Cannot make the last public product private.');
    }

    Products.update(productId, {
      $set: { userId: this.userId },
    });
  },
});

export const makePublic = new ValidatedMethod({
  name: 'products.makePublic',
  validate: PRODUCT_ID_ONLY,
  run({ productId }) {
    if (!this.userId) {
      throw new Meteor.Error('api.products.makePublic.notLoggedIn',
        'Must be logged in.');
    }

    const product = Products.findOne(productId);

    if (!product.editableBy(this.userId)) {
      throw new Meteor.Error('api.products.makePublic.accessDenied',
        'You don\'t have permission to edit this product.');
    }

    // XXX the security check above is not atomic, so in theory a race condition could
    // result in exposing private data
    Products.update(productId, {
      $unset: { userId: true },
    });
  },
});

export const updateName = new ValidatedMethod({
  name: 'products.updateName',
  validate: new SimpleSchema({
    productId: { type: String },
    newName: { type: String },
  }).validator(),
  run({ productId, newName }) {
    const product = Products.findOne(productId);

    if (!product.editableBy(this.userId)) {
      throw new Meteor.Error('api.products.updateName.accessDenied',
        'You don\'t have permission to edit this product.');
    }

    // XXX the security check above is not atomic, so in theory a race condition could
    // result in exposing private data

    Products.update(productId, {
      $set: { name: newName },
    });
  },
});

export const remove = new ValidatedMethod({
  name: 'products.remove',
  validate: PRODUCT_ID_ONLY,
  run({ productId }) {
    const product = Products.findOne(productId);

    if (!product.editableBy(this.userId)) {
      throw new Meteor.Error('api.products.remove.accessDenied',
        'You don\'t have permission to remove this product.');
    }

    // XXX the security check above is not atomic, so in theory a race condition could
    // result in exposing private data

    if (product.isLastPublicProduct()) {
      throw new Meteor.Error('api.products.remove.lastPublicProduct',
        'Cannot delete the last public product.');
    }

    Products.remove(productId);
  },
});

// Get list of all method names on Products
const PRODUCTS_METHODS = _.pluck([
  insert,
  makePublic,
  makePrivate,
  updateName,
  remove,
], 'name');

if (Meteor.isServer) {
  // Only allow 5 product operations per connection per second
  DDPRateLimiter.addRule({
    name(name) {
      return _.contains(PRODUCTS_METHODS, name);
    },

    // Rate limit per connection ID
    connectionId() { return true; },
  }, 5, 1000);
}

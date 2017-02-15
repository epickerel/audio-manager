/* eslint-disable prefer-arrow-callback */

import { Meteor } from 'meteor/meteor';

import { Products } from '../products.js';

Meteor.publish('products.public', function productsPublic() {
  return Products.find({
    userId: { $exists: false },
  }, {
    fields: Products.publicFields,
  });
});

Meteor.publish('products.private', function productsPrivate() {
  if (!this.userId) {
    return this.ready();
  }

  return Products.find({
    userId: this.userId,
  }, {
    fields: Products.publicFields,
  });
});

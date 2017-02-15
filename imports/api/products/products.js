import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Factory } from 'meteor/factory';
import i18n from 'meteor/universe:i18n';

class ProductsCollection extends Mongo.Collection {
  insert(product, callback, locale = 'en') {
    const ourProduct = product;
    if (!ourProduct.name) {
      const defaultName = i18n.__(
        'api.products.insert.product',
        null,
        { _locale: locale }
      );
      let nextLetter = 'A';
      ourProduct.name = `${defaultName} ${nextLetter}`;

      while (this.findOne({ name: ourProduct.name })) {
        // not going to be too smart here, can go past Z
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        ourProduct.name = `${defaultName} ${nextLetter}`;
      }
    }

    return super.insert(ourProduct, callback);
  }
  remove(selector, callback) {
    //Todos.remove({ productId: selector });
    return super.remove(selector, callback);
  }
}

export const Products = new ProductsCollection('Products');

// Deny all client-side updates since we will be using methods to manage this collection
Products.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Products.schema = new SimpleSchema({
  name: { type: String },
  incompleteCount: { type: Number, defaultValue: 0 },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
});

Products.attachSchema(Products.schema);

// This represents the keys from Products objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Products.publicFields = {
  name: 1,
  incompleteCount: 1,
  userId: 1,
};

Factory.define('product', Products, {});

Products.helpers({
  // A product is considered to be private if it has a userId set
  isPrivate() {
    return !!this.userId;
  },
  isLastPublicProduct() {
    const publicProductCount = Products.find({ userId: { $exists: false } }).count();
    return !this.isPrivate() && publicProductCount === 1;
  },
  editableBy(userId) {
    if (!this.userId) {
      return true;
    }

    return this.userId === userId;
  },
});

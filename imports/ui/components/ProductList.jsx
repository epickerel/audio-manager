/* global alert */

import React from 'react';
import { Link } from 'react-router';
import i18n from 'meteor/universe:i18n';
import BaseComponent from './BaseComponent.jsx';
import { insert } from '../../api/products/methods.js';

export default class ProductList extends BaseComponent {
  constructor(props) {
    super(props);
    this.createNewProduct = this.createNewProduct.bind(this);
  }

  createNewProduct() {
    const { router } = this.context;
    const productId = insert.call({ locale: i18n.getLocale() }, (err) => {
      if (err) {
        router.push('/');
        /* eslint-disable no-alert */
        console.error(i18n.__('components.productList.newProductError'), err);
      }
    });
    router.push(`/products/${productId}`);
  }

  deleteProduct() {
    remove.call({ todoId: this.props.todo._id }, displayError);
  }

  render() {
    const { products } = this.props;
    return (
      <div className="products">
        <a className="link-list-new" onClick={this.createNewProduct}>
          <span className="icon-plus" />
          {i18n.__('components.productList.newProduct')}
        </a>
        {products.map(product => (
          <div className="product" htmlFor={this.props.product._id}>
            <a
              className="delete-item"
              href="#delete"
              onClick={this.deleteProduct}
              onMouseDown={this.deleteProduct}
            >
              <span className="icon-trash" />
            </a>
            <Link
              to={`/products/${product._id}`}
              key={product._id}
              title={product.name}
              activeClassName="active"
            >
              {product.userId
                ? <span className="icon-lock" />
                : null}
              {product.incompleteCount
                ? <span className="count-product">{product.incompleteCount}</span>
                : null}
              {product.name}
            </Link>
          </div>
        ))}
      </div>
    );
  }
}

ProductList.propTypes = {
  product: React.PropTypes.object,
  products: React.PropTypes.array,
};

ProductList.contextTypes = {
  router: React.PropTypes.object,
};

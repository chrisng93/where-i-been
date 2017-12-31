import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import * as _ from 'underscore';

import STYLES from '../styles';

export default class Filter extends Component {
  constructor(props) {
    super(props);
    this.addOrRemove = this.addOrRemove.bind(this);
    this.renderChildren = this.renderChildren.bind(this);
  }

  addOrRemove(list, value) {
    if (_.contains(list, value)) {
      return _.without(list, value);
    }
    list.push(value);
    return list;
  }

  renderChildren() {
    const {filters, options, onChangeFilter} = this.props;
    return (
      <div>
        <h2>Filter</h2>
        <h4>City</h4>
        <div>
          {_.map(options.city, (city) =>
            <div
              key={city}
              onClick={() => onChangeFilter({...filters, city})}
            >
              {city}
            </div>
          )}
        </div>
        <h4>Regions</h4>
        <div>
          {_.map(options.region, (region) =>
            <div
              key={region}
              onClick={() => onChangeFilter({...filters, region: this.addOrRemove(filters.region, region)})}
            >
              {region}
            </div>
          )}
        </div>
        <h4>Food Types</h4>
        <div>
          {_.map(options.type, (type) =>
            <div
              key={type}
              onClick={() => onChangeFilter({...filters, type: this.addOrRemove(filters.type, type)})}
            >
              {type}
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Paper style={STYLES.filter} zDepth={2} rounded={false} children={this.renderChildren()} />
    );
  }
}

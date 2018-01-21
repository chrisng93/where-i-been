import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import * as _ from 'underscore';

import STYLES from '../styles';
import Filter from './Filter';
import Map from './Map';

const TITLE = 'Where I\'m Eating';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TEST DATA.
      restaurants: {
        1: {id: 1, name: 'thursday kitchen', city: 'manhattan', region: 'nyc area', type: 'korean fusion', summary: 'good place for drinks and tapas with friends', orderSuggestion: 'lychee reach rich', yelpURL: '', lat: 40.727619, lng: -73.983749},
        2: {id: 2, name: 'sushi on jones', city: 'manhattan', region: 'nyc area', type: 'japanese', summary: 'good value omakase, but rushed vibes', orderSuggestion: 'omakase', yelpURL: '', lat: 40.726670, lng: -73.992090},
        3: {id: 3, name: 'paulie gee\'s', city: 'brooklyn', region: 'nyc area', type: 'pizza', summary: 'great wood fired pizza', orderSuggestion: 'ricotta be kiddin\' me', yelpURL: '', lat: 40.729653, lng: -73.958618},
        4: {id: 4, name: 'spicy village', city: 'manhattan', region: 'nyc area', type: 'chinese', summary: 'good hand pulled noodles and chicken, but not as spicy as expected', orderSuggestion: 'big tray chicken', yelpURL: '', lat: 40.717019, lng: -73.993388},
      },
      filters: {
        city: [],
        region: [],
        type: [],
      },
    };
    this.filterRestaurants = this.filterRestaurants.bind(this);
    this.filterOptions = this.filterOptions.bind(this);
  }
  
  componentWillMount() {
    // TODO: Make API call to the backend to grab restaurants.
  }

  // filterRestaurants filters restaurants for the map to render.
  filterRestaurants() {
    const {restaurants, filters} = this.state;
    return _.reduce(restaurants, (obj, restaurant) => {
      if ((!filters.city.length || _.contains(filters.city, restaurant.city)) &&
      (!filters.region.length || _.contains(filters.region, restaurant.region)) &&
      (!filters.type.length || _.contains(filters.type, restaurant.type))) {
        obj[restaurant.id] = restaurant;
      }
      return obj
    }, {});
  }

  // filterOptions creates a list of options for the different types of filters
  // (city, region, type) given the set of restaurants.
  filterOptions() {
    return _.reduce(this.state.restaurants, (options, restaurant) => {
      if (!_.contains(options.city, restaurant.city)) {
        options.city.push(restaurant.city);
      }
      if (!_.contains(options.region, restaurant.region)) {
        options.region.push(restaurant.region);
      }
      if (!_.contains(options.type, restaurant.type)) {
        options.type.push(restaurant.type);
      }
      return options;
    }, {city: [], region: [], type: []});
  }

  render() {
    return (
      <div>
        <AppBar
          style={STYLES.appBar}
          titleStyle={STYLES.appBarTitle}
          iconElementLeft={<div></div>}
          title={TITLE}
        />
        <Map restaurants={this.filterRestaurants()} />
        <Filter
          filters={this.state.filters}
          options={this.filterOptions()}
          onChangeFilter={filters => this.setState({filters})}
        />
      </div>
    );
  }
}

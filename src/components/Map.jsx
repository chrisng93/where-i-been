/*eslint-disable no-undef*/
import Dialog from 'material-ui/Dialog';
import React, { Component } from 'react';
import * as _ from 'underscore';

import RestaurantModal from './RestaurantModal';

export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Have this show restaurants from the entire map.
      center: {lat: 40.727911, lng: -73.985537},
      zoom: 14,
      selectedRestaurant: null,
      // Mapping of restaurant ID to marker instance. It's used to add/remove markers from the map.
      markers: {},
    };
    this.map = null;
    this.setMarkers = this.setMarkers.bind(this);
  }

  componentDidMount() {
    const {center, zoom} = this.state;
    // Init map.
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom,
      center,
    });
    this.setMarkers({}, this.props.restaurants);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.restaurants !== nextProps.restaurants) {
      this.setMarkers(this.props.restaurants, nextProps.restaurants);
    }
  }

  setMarkers(previousRestaurants, nextRestaurants) {
    const markers = this.state.markers;
    // Removed markers are in the previous restaurant object, but not the next.
    const removed = _.filter(previousRestaurants, restaurant => !nextRestaurants[restaurant.id]);
    // Added markers are in the next restaurant object, but not the previous.
    const added = _.filter(nextRestaurants, restaurant => !previousRestaurants[restaurant.id]);
    _.each(removed, restaurant => {
      // Remove markers and then delete from marker mapping.
      markers[restaurant.id].setMap(null);
      delete markers[restaurant.id];
    })
    _.each(added, restaurant => {
      // Add markers to map and mapping.
      const marker = new google.maps.Marker({
        position: {lat: restaurant.lat, lng: restaurant.lng},
        map: this.map,
        animation: google.maps.Animation.DROP,
      });
      marker.addListener('click', () => {
        this.setState({selectedRestaurant: restaurant});
      });
      markers[restaurant.id] = marker;
    });
    this.setState({markers});
  }

  render() {
    const {selectedRestaurant} = this.state;
    return (
      <div id="map">
        <Dialog
          open={!!selectedRestaurant}
          onRequestClose={() => this.setState({selectedRestaurant: null})}
        >
          {selectedRestaurant ? <RestaurantModal restaurant={selectedRestaurant} /> : null}
        </Dialog>
      </div>
    );
  }
}

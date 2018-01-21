/*eslint-disable no-undef*/
import Dialog from 'material-ui/Dialog';
import React, { Component } from 'react';
import * as _ from 'underscore';

import RestaurantModal from './RestaurantModal';

// A constant for Google's map projection. Defines the dimesions of the Google map world. Used
// for zoom calculation.
const WORLD_DIMENSIONS = {width: 256, height: 256};
// Padding for the zoom function. This is so that the markers aren't too close to the edge of
// the map.
const MAP_PADDING = 0.4;
// Specifies what the maximum zoom should be for the map.
const MAX_ZOOM = 21;
// Wait time before adjusting the zoom level again.
const ZOOM_TIMEOUT_MS = 80;

export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Have this show restaurants from the entire map.
      center: {lat: 40.727911, lng: -73.985537},
      zoom: 14,
      // bounds is the bounding box for the map. When you change the set of applicable restaurants,
      // the bounding box will change to match.
      bounds: null,
      selectedRestaurant: null,
      // marks is a mapping of restaurant ID to marker instance. It's used to add/remove markers
      // from the map.
      markers: {},
    };
    this.map = null;
    this.createBounds = this.createBounds.bind(this);
    this.calculateZoom = this.calculateZoom.bind(this);
    this.latRad = this.latRad.bind(this);
    this.zoom = this.zoom.bind(this);
    this.pan = this.pan.bind(this);
    this.setMarkers = this.setMarkers.bind(this);
  }

  componentDidMount() {
    const {center, zoom} = this.state;
    const {restaurants} = this.props;
    this.map = new google.maps.Map(document.getElementById('map'), {zoom, center});
    this.map.fitBounds(this.createBounds(restaurants));
    this.setMarkers({}, restaurants);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.restaurants !== nextProps.restaurants) {
      this.setMarkers(this.props.restaurants, nextProps.restaurants);
    }
  }

  // createBounds creates a new bounding box given a list of restaurants.
  createBounds(restaurants) {
    const bounds = new google.maps.LatLngBounds();
    _.each(restaurants, restaurant => bounds.extend(new google.maps.LatLng(restaurant.lat, restaurant.lng)));
    return bounds;
  }

  // calculateZoom calculates zoom given a bounds.
  // https://stackoverflow.com/questions/6048975/google-maps-v3-how-to-calculate-the-zoom-level-for-a-given-bounds
  calculateZoom(bounds) {
    const map = document.getElementById('map');
    const mapDimensions = {height: map.clientHeight * MAP_PADDING, width: map.clientWidth * MAP_PADDING};
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latFraction = (this.latRad(ne.lat()) - this.latRad(sw.lat())) / Math.PI;
    const lngDiff = ne.lng() - sw.lng();
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
    const latZoom = this.zoom(mapDimensions.height, WORLD_DIMENSIONS.height, latFraction);
    const lngZoom = this.zoom(mapDimensions.width, WORLD_DIMENSIONS.width, lngFraction);
    return Math.min(latZoom, lngZoom, MAX_ZOOM);
  }

  // latRad gets the radius of a latitude.
  latRad(lat) {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  // zoom calculates zoom given the map, world, and fraction values.
  zoom(mapPx, worldPx, fraction) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  // pan smoothly moves the map to fit the input bounds.
  pan(bounds) {
    let currZoom = this.map.getZoom();
    let finalZoom = this.calculateZoom(bounds);
    const steps = this.getEqualDistancePoints(this.map.getCenter(), bounds.getCenter(), Math.abs(finalZoom - currZoom));
    let index = 0;

    const makeStep = (zoom, index) => {
      // Wait ZOOM_TIMEOUT_MS * (index+1) time before adjusting the zoom again. This is to
      // create an illusion of smoothness.
      setTimeout(((zoom, index) => () => {
        this.map.setZoom(zoom);
        this.map.setCenter(steps[index]);
      })(zoom, index), ZOOM_TIMEOUT_MS * (index+1));
    };

    // Adjust the current zoom one by one until it's equal to the final zoom level.
    if (currZoom < finalZoom) {
      // Zooming in.
      for (let zoom = currZoom; zoom < finalZoom; zoom++) {
        makeStep(zoom, index);
        index++;
      }
    } else {
      // Zooming out.
      for (let zoom = currZoom; zoom > finalZoom; zoom--) {
        makeStep(zoom, index);
        index++;
      }
    }
  }

  // find straigt line from current center to new center and break up into equal segments that correspodn
  // to the zooms
  getEqualDistancePoints(beginning, end, numSegments) {
    const stepY = (end.lat() - beginning.lat()) / numSegments;
    const stepX = (end.lng() - beginning.lng()) / numSegments;
    const steps = [];
    steps.push(new google.maps.LatLng(beginning.lat() + stepY, beginning.lng() + stepX));
    for (let i = 1; i < numSegments; i++) {
      steps.push(new google.maps.LatLng(steps[i-1].lat() + stepY, steps[i-1].lng() + stepX));
    }
    return steps;
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
      marker.addListener('click', () => this.setState({selectedRestaurant: restaurant}));
      markers[restaurant.id] = marker;
    });

    // Pan to set view to new markers.
    this.pan(this.createBounds(nextRestaurants));

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

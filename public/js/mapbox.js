// this basically is a JavaScript file that we are going to integrate into our PUG tempalte and which will then run on the client side
// console.log('hello from the client side mapbox.js');

export const displayMap = (locations) => {
  // to display map in our website using mapBox library
  mapboxgl.accessToken =
    'pk.eyJ1IjoicHJhbmphbDE2IiwiYSI6ImNsMzdpYzF6czAxbXQzYm1uOXI1YzFnZmYifQ.DZ1-bI8SeuSVHMLyelDDXQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/pranjal16/cl37j0nj5000315l74ydjgb97',
    scrollZoom: false, // to close zoom on the map
    // center: [-118.113491, 34.111745],
    // zoom: 4,
  });

  // we have access to mapbox objects as we have added its script in the header section
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div'); // creating new html element
    el.className = 'marker';

    // add marker to the map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  // create zoom animation on the map
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

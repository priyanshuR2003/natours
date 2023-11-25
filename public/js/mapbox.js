//disable eslint:
/*eslint-disable*/

export const displayMap = (locations) => {
  // console.log("Hello from the client side");

  //adding map(from Mapbox) to Js file:
  mapboxgl.accessToken =
    "pk.eyJ1IjoicHJpeWFuc2h1MjAwMyIsImEiOiJjbGw5OGJ6ejgxaHkyM2tvenZjNXR4bW8zIn0.-FkmnAAxHXg5sOOJ98mFfg";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/priyanshu2003/cll99cfo100oi01qp77bkfekp",
    scrollZoom: false,
  });

  //automatically figure out position of map(based on tour locations):
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker:
    const el = document.createElement("div");
    el.className = "marker";

    //add marker(to map):
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom", //bottom of marker will be located ar GPS location
    })
      .setLngLat(loc.coordinates)
      .addTo(map); //telling mapbox about marker locations

    //add popup to map locations:
    new mapboxgl.Popup({
      //prevent overlapping of marker and popup:
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //include locations:(to obj)
    bounds.extend(loc.coordinates);
  });

  //make map fit the bounds(visible area):
  map.fitBounds(bounds, {
    //padding to bounds:
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

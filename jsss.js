/**
 * Moves the map to display over Berlin
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 */
  var transportation="car";
  var departure_time_content="";
  var type_time="";
  var markers=[]
  var lines=[]
  var avoid="";
  var colors=["#32a852", "#3285a8", "#8f4ad4", "#d44a8a"]
  var platform = new H.service.Platform({
    'apikey': 'IA6wsOsWVEGNVl1rjQ8REXSMmQCkW5sfBpkGL4I1kng'
  });
  var defaultLayers = platform.createDefaultLayers();
  var map = new H.Map(document.getElementById('map'),
  defaultLayers.vector.normal.map,{
    center: {lat: 21.12908,lng:-101.685086},
    zoom: 13,
    pixelRatio: window.devicePixelRatio || 1
  });

  window.addEventListener('resize',() => map.getViewPort().resize());
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  var ui = H.ui.UI.createDefault(map,defaultLayers);
  
  var mapEvents = new H.mapevents.MapEvents(map);
  new H.mapevents.Behavior(mapEvents);
  var mapSettings = new H.ui.MapSettingsControl({
    alignment: 'top-right',
    entries: [{
      name: 'Normal map',
      mapType: maptypes.normal
    }]
  });
  ui.addControl('mapsettings',mapSettings);
  
  // Provided that map is instantiated and there are some markers
  // on the map that must be inspected.
  map.getObjectAt(21.12908,-101.67374,(obj) => {
      if (obj && obj instanceof H.map.Marker) {
          console.log(obj.getGeometry());
      }
  });
  var transportation_button = document.querySelector(".button_transportation");
  transportation_button.addEventListener("click",function(){
      document.querySelector("body").classList.toggle("active");
  })
  
  function addMarkersToMap(map,lat,lon) {
    let mar= new H.map.Marker({lat:lat,lng:lon});
    map.addObject(mar);
    markers.push(mar)
}
  
function moveMapToPlace(map,lat,lon,zoom=3){
  map.setCenter({lat: lat,lng: lon});
  map.setZoom(zoom);
}  
function addPolylineToMap(map, poly, color) {
  var lineString = new H.geo.LineString();
  poly["polyline"].forEach(coordinates=>{
    lineString.pushPoint({lat:coordinates[0], lng:coordinates[1]});
  })
  let polyline=new H.map.Polyline(
    lineString, { style: { lineWidth: 5, strokeColor:color}}
  )
  map.addObject(polyline);
  lines.push(polyline)
}
function remove_parts(elements) {
  let parts=elements.flat(1);
  parts.forEach(part=>{
    map.removeObject(part);
  })
}

function directions(){
  let value1 = document.querySelector("#first_place").value;
  let value2 = document.querySelector("#second_place").value;
  let lat1 = parseFloat(value1.split(",")[0]);
  let lon1 = parseFloat(value1.split(",")[1]);
  let lat2 = parseFloat(value2.split(",")[0]);
  let lon2 = parseFloat(value2.split(",")[1]);
  transportation=document.querySelector('input[name="transportation"]:checked').value;
  departure_time=document.querySelector("#departure-time").value;
  type_time=document.querySelector('input[name="time_type"]:checked').value;
  avoid=document.querySelectorAll('input[name="avoid"]:checked');
  let departure_time_content="";
  if(departure_time){
  departure_time_content=`&${type_time}=${departure_time}:30`
  }
  if(avoid.length){
    let avoid_content="&avoid[features]=";
    avoid.forEach(element=>{
      avoid_content+=`${element.value},`;
    })
    avoid=avoid_content;
  }
  else{
    avoid="";
  }
  remove_parts([markers, lines]);
  markers=[];
  lines=[];
  moveMapToPlace(map,lat1,lon1,9);
  addMarkersToMap(map,lat1,lon1);
  addMarkersToMap(map,lat2,lon2);
  fetch(`https://router.hereapi.com/v8/routes?apikey=IA6wsOsWVEGNVl1rjQ8REXSMmQCkW5sfBpkGL4I1kng&lang=es&origin=${value1}&destination=${value2}&return=polyline%2Csummary%2Cactions%2Cinstructions%2Ctolls&transportMode=${transportation}${departure_time_content}${avoid}&alternatives=3`)
  .then(response => response.json())
  .then(info => {
      var content="";
      document.querySelector("#find_routes").innerText=info["routes"].length;
      for(let index=0; index<=info["routes"].length-1;index++){
      data=info["routes"][index]["sections"][0];
      let dt=luxon.DateTime.fromISO(`${data["departure"]["time"]}`)
      let dt_another=luxon.DateTime.fromISO(`${data["arrival"]["time"]}`)
      dt=dt.setLocale('es').toLocaleString(luxon.DateTime.DATETIME_FULL);
      dt_another=dt_another.setLocale('es').toLocaleString(luxon.DateTime.DATETIME_FULL);
  
      let tolls="";
      try{
        data["tolls"].forEach(element => {
          tolls+=`
          <li>Caseta ${element["tollCollectionLocations"][0]["name"]}: $${element["fares"][0]["price"]["value"]} </li> 
          `
        });
      }
      catch{tolls="No hay casetas"}
      let instructions="";
      data["actions"].forEach(element=>{
        instructions+=`<li>${element["instruction"]}</li>`
      })
      content+=`
      <h3>Ruta ${index}<span style="display:inline-block;color:${colors[index]};">&#9632;</span></h3>
      <h5>Tiempo de partida: ${dt}</h5>
            <h5>Tiempo de llegada: ${dt_another}</h5>
            <h3> Casetas:</h3>
            <ol class="tolls">
            ${tolls}
            </ol>
            <h3> Instrucciones:</h3>
            <ol class="action">${instructions}</ol>
      `
      const polyline = data.polyline;
      let y=decode(polyline);
      addPolylineToMap(map, y, colors[index]);
    }
      document.querySelector("#instructions").innerHTML=content;
  });
}


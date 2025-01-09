/**
 * Moves the map to display over Berlin
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 */
  var transportation="car";
  var departure_time_content="";
  var type_time="";
  var markers=[];
  var lines=[];
  var avoid="";
  var index_page=0;
  var colors=["#32a852", "#3285a8", "#8f4ad4", "#d44a8a"];

  
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
  try{
    var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  }
  catch{}
  window.addEventListener('resize',() => map.getViewPort().resize());
  var ui = H.ui.UI.createDefault(map,defaultLayers);

  // Añade un marker, solo se necesitan las coordenadas y el mapa. Se agregan los event listeners necesarios y se añade al array "markers" para que se borren
// function addMarkersToMap(map,lat,lon) {
//     var marker = new H.map.Marker({lat:lat, lng:lon}, {
//     volatility: true
//     });
//     marker.draggable = true;
//     map.addObject(marker);
//     markers.push(marker);
//     map.addEventListener('dragstart', function(ev) {
//       var target = ev.target,
//       pointer = ev.currentPointer;
//       if (target instanceof H.map.Marker) {
//         var targetPosition = map.geoToScreen(target.getGeometry());
//         target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
//         behavior.disable();
//       }
//     }, false);

//     map.addEventListener('dragend', function(ev) {
//       var target = ev.target;
//       if (target instanceof H.map.Marker) {
//         behavior.enable();
//         var newPosition = target.getGeometry();
//         var latitude = newPosition.lat;
//         var longitude = newPosition.lng;
//         }
//     }, false);
//     map.addEventListener('drag', function(ev) {
//       var target = ev.target,
//       pointer = ev.currentPointer;
//       if (target instanceof H.map.Marker) {
//         target.setGeometry(map.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
//       }
      
//     }, false);
//     return marker;
// }
  
// Poner las coordenadas del marker añadido
function search_from_marker(marker, latitude, longitude){
  if(markers.length>=3){
    let stop=add_stop()
    let final_destination=document.querySelector(`#second_place`);
    stop.value=final_destination.value;
    final_destination.value=`${latitude},${longitude}`
  }
  else{
    document.querySelectorAll(`.input_search`)[markers.indexOf(marker)].value=`${latitude},${longitude}`
  }
}

// Mover el mapa a esas coordenadas
function moveMapToPlace(map,lat,lon){
  map.setCenter({lat: lat,lng: lon});
}  

// Añade la polyline, se necesita un object con ["polyline"] con las polylines
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


// 
// Función más importante 
// 
function directions(){
  let value1 = document.querySelector("#first_place").value;
  let value2 = document.querySelector("#second_place").value;
  value1=value1.replace(/ /g,'');
  value2=value2.replace(/ /g,'');
  let lat1 = parseFloat(value1.split(",")[0]);
  let lon1 = parseFloat(value1.split(",")[1]);
  let lat2 = parseFloat(value2.split(",")[0]);
  let lon2 = parseFloat(value2.split(",")[1]);
  transportation=document.querySelector('input[name="transportation"]:checked').value;
  departure_time=document.querySelector("#departure-time").value;
  type_time=document.querySelector('input[name="time_type"]:checked').value;
  let mode=document.querySelector('input[name="mode"]:checked').value;
  avoid=document.querySelectorAll('input[name="avoid"]:checked');
  let tolls_able="%2Ctolls";
  if (transportation=="bicycle"||transportation=="pedestrian") {
    tolls_able="";
  }
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
  if(mode!="none"){
    mode=`&mode=${mode}`
  }
  else{
    mode="";
  }
  remove_parts([markers, lines]);
  markers=[];
  lines=[];
  let additional_inputs=document.querySelectorAll(".additional_input");
  var vias="";
  if (additional_inputs.length>=1) {
    additional_inputs.forEach(element=>{
      vias+=`&via=${element.value}`;
      addMarkersToMap(map,element.value.split(",")[0],element.value.split(",")[1]);
    })
  }
  moveMapToPlace(map,lat1,lon1);
  addMarkersToMap(map,lat1,lon1);
  addMarkersToMap(map,lat2,lon2);
  fetch(`https://router.hereapi.com/v8/routes?apikey=IA6wsOsWVEGNVl1rjQ8REXSMmQCkW5sfBpkGL4I1kng&lang=es&origin=${value1}&destination=${value2}${mode}&return=polyline%2Csummary%2Cactions%2Cinstructions${tolls_able}&transportMode=${transportation}${departure_time_content}${avoid}${vias}&alternatives=3`)
  .then(response => {
    if (response.status==400) {
      alert("No se puede hacer lo solicitado por los datos")
      return
    }
    response.json()
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
      info["routes"][index]["sections"].forEach(section=>{
        var polyline = section.polyline;
        let y=decode(polyline);
        addPolylineToMap(map, y, colors[index]);
        section["actions"].forEach(element=>{
          instructions+=`<li>${element["instruction"]}</li>`
        })
        })
      let display="none";
      if (index==0) {
        display="block";
      }
      content+=`
      <div id="route-${index}" style="display:${display}">
      <h5>Ruta ${index+1}<span style="display:inline-block;color:${colors[index]};">&#9632;</span></h5>
      <h6>Tiempo de partida: ${dt}</h6>
      <h6>Tiempo de llegada: ${dt_another}</h6>
      <h5> Casetas:</h5>
      <ol class="tolls">
      ${tolls}
      </ol>
      <h5>Instrucciones:</h5>
      <ol class="action">${instructions}</ol>
      </div>`
    }
      document.querySelector("#instructions").innerHTML=content;
  });
  })
}

// var transportation_button = document.querySelector(".button_transportation");
//     transportation_button.addEventListener("click",function(){
//         document.querySelector("body").classList.toggle("active");
//     })

  function move_page(direction) {
    try{
    document.querySelector(`#route-${index_page}`).style.display="none";
    if (direction=="prev") {
      index_page-- 
    }
    else{
      index_page++
    }
    document.querySelector(`#route-${index_page}`).style.display="block";
    }
    catch{
      if (direction=="prev") {
      index_page++  
    }
    else{
      index_page--
    }
    document.querySelector(`#route-${index_page}`).style.display="block";
    }
  }

  // Buscar con el value de #query insertado por el usuario ciudades para añadirlas a el select 


// Poner en el valor del element datalistplace (lugar de partida o llegada) el elemento del select elegido 
function onchange_search() {
  let place=document.querySelector("#datalist_place").value;
  let value=document.querySelector("#datalist_results").value;
  document.querySelector(`#${place}`).value=value;
}

// Añade un stop en el div de Paradas adicionales ("#additional") una stop (input casi igual al de llegada o partida)
function add_stop(){
  let div=document.querySelector("#additional");
  let span=document.createElement("span")
  let input=document.createElement("input")
  input.classList.add("input_search")
  input.classList.add("additional_input")
  let button=document.createElement("button");
  button.innerText="X";
  button.addEventListener("click",()=> {remove_element(button)});
  span.append(input)
  span.append(button)
  div.append(span)
  return input;
}

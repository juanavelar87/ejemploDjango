import { useState, createContext, useEffect, useContext } from 'react'
import './App.css'

var API_KEY="IA6wsOsWVEGNVl1rjQ8REXSMmQCkW5sfBpkGL4I1kng";
const OpenModalContext = createContext(null);
export default function App(props) {
    const[state, setState]=useState({
        current_position:{
            lat:0,
            lng:0
        },
        destinations:[],
        transportation:"car",
        time:"",
        mode:"fastest",
        avoid:"tollRoad",
        response:"",
        incorrect:false,
        score:0,
        modal_opened:false,
        modal_parameter_opened:"destinations_parameter"
    })
    useEffect(() => {
        const handleContextMenu = (ev) => {
            var pos = map.screenToGeo(ev.viewportX, ev.viewportY);
            addToDestinations(map, pos.lat, pos.lng);
        };

        map.addEventListener('contextmenu', handleContextMenu, false);

        return () => {
            map.removeEventListener('contextmenu', handleContextMenu, false);
        };
    }, [map]);
    const openModal = (modal_opened, modal_parameter_opened=state.modal_parameter_opened) => {
        setState(prevState => ({ ...prevState, modal_opened: modal_opened, modal_parameter_opened:modal_parameter_opened}));
    }
    const changeDestination=(index,lat, lng)=>{
        var destinations=state.destinations;
        destinations[index].string=`${lat},${lng}`;
        destinations[index].marker.setGeometry({lat:lat, lng:lng});   
        setState(prevState => ({ ...prevState, destinations: destinations}));     
    }
    function reverseGeocoding(lat, lng, index){
    fetch(`https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=es-MX&apiKey=${API_KEY}`)
        .then(response => response.json())
        .then(data=>{
            var destinations=state.destinations;
            destinations[index].name=data["items"][0]["address"]["label"];
            setState(prevState => ({ ...prevState,
                destinations: destinations
            }));
        });
    }
    function addToDestinations(map,lat,lng) {
        var marker = new H.map.Marker({lat:lat, lng:lng}, {
        volatility: true
        });
        marker.draggable = true;
        map.addObject(marker);
        var destinations=state.destinations;
        var destination ={string:`${lat},${lng}`, marker:marker};
        destinations.push(destination);
        var index=destinations.length -1;
        reverseGeocoding(lat, lng, index)
        setState(prevState => ({ 
            ...prevState, 
            destinations: destinations
        }));
        map.addEventListener('dragstart', function(ev) {
            var target = ev.target;
            var pointer = ev.currentPointer;
            if (target instanceof H.map.Marker) {
                var targetPosition = map.geoToScreen(target.getGeometry());
                target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer.viewportY - targetPosition.y);
                behavior.disable();
            }
        }, false);

        map.addEventListener('dragend', function(ev) {
        var target = ev.target;
        if (target instanceof H.map.Marker) {
            behavior.enable();
            var newPosition = target.getGeometry();
            var latitude = newPosition.lat;
            var longitude = newPosition.lng;
            destination.string=`${latitude},${longitude}`;
            setState(prevState => ({ ...prevState, destinations: destinations}));
            reverseGeocoding(latitude, longitude, index)
        }
        }, false);
        map.addEventListener('drag', function(ev) {
        var target = ev.target,
        pointer = ev.currentPointer;
        if (target instanceof H.map.Marker) {
            target.setGeometry(map.screenToGeo(pointer.viewportX - target['offset'].x, pointer.viewportY - target['offset'].y));
        }
        
        }, false);
        moveMapToPlace(map, lat, lng);
        map.setZoom(18);
        return marker;
    }
    const successCallback = (position) => {
        localStorage.setItem("current_position", JSON.stringify({"lat":position.coords.latitude, "lng":position.coords.longitude}));
        if (state.destinations.length==0) {
            addToDestinations(map, position.coords.latitude, position.coords.longitude);
        }
        setState(prevState => ({ ...prevState, current_position: {lat:position.coords.latitude, lng:position.coords.longitude} }));
    };
    const errorCallback = (error) => {
        setState(prevState => ({ ...prevState, current_position: {lat:-1, lng:-1} }));
    };
    if (state.current_position.lat===0 && state.current_position.lng===0) {
        if(localStorage.getItem("current_position")){
            var current_position=JSON.parse(localStorage.getItem("current_position"));
            moveMapToPlace(map, current_position.lat, current_position.lng);
            if (state.destinations.length==0) {
                addToDestinations(map, current_position.lat, current_position.lng);
            }
            map.setZoom(18);
            setState(prevState => ({ ...prevState, current_position: {lat:current_position.lat, lng:current_position.lng} }));
        }
        else{
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});    
        }
    }
    return (
        <div>
            <div className="container clearfix" style={{zIndex:3, position:"absolute", top:0, margin:"10px"}}>
            <SearchComponent userPosition={state.current_position} addToDestinations={addToDestinations} placeholder="Busca lugares"/>
            </div>
            <OpenModalContext.Provider value={openModal}>
            <LeftComponents/>
            <MiddleModal open={state.modal_opened} setState={setState} state={state} changeDestination={changeDestination} addToDestinations={addToDestinations} circleComponentId={state.modal_parameter_opened}/>
            </OpenModalContext.Provider>
        </div> 
        )
}

function DestinationsBoxes(props){
    return(
        <div>
        
        </div>
    )
}
function SearchComponent(props) {
    const [search, setSearch]=useState({
        values:[],
        query:"",
        selected_element:null,
        reply_places:[],
    })
    function updateResponse(event) {
        setSearch({
            ...search,
            query:event.target.value
        })
    }
    function addToDestinations(map){
        var lat=search.selected_element.target.dataset.lat;
        var lng=search.selected_element.target.dataset.lng;
        props.addToDestinations(map, lat, lng);
        setSearch({
            ...search,
            reply_places:[]
        })
    }
    function searchApi(){
        var fetch_link="";
        fetch_link=`https://discover.search.hereapi.com/v1/discover?at=${props.userPosition.lat},${props.userPosition.lng}&lang=es&q=${search.query}&apiKey=${API_KEY}`;
        fetch(fetch_link)
        .then(response => response.json())
        .then(data=>{
            let places=[];
            data["items"].forEach(place=>{
                places.push(<PlaceSearchButton setSearch={setSearch} lat={place.position.lng} lng={place.position.lng} place={place}/>);
            })
            places.push(
            <>
            <div className="row gx-5 mt-2">
                <div className="col d-flex justify-content-center">
                <button className="btn btn-secondary"><i className="fa fa-arrow-left"></i></button>
                </div>
                <div className="col d-flex justify-content-center">
                <button className="btn btn-primary"><i className="fa fa-arrow-right"></i></button>
                </div>
            </div>
            <div className="row gx-5 mt-2">
                <div className="col d-flex justify-content-center">
                <button className="btn btn-warning" onClick={()=>moveMapToPlace(search.selected_element.dataset.lat, search.selected_element.dataset.lng)}>Mostrar en el mapa</button>
                </div>
                <div className="col d-flex justify-content-center">
                <button className="btn btn-primary" onClick={()=>addToDestinations(map)}>Agregar parada</button>
                </div>
            </div>
            </>
            );
            setSearch({
                ...search,
                reply_places:places
            })
        });
    }
    return(
        <div style={{display:"flex", justifyContent:"center"}}>
            <h1 id="query_type_company" className="form-control text-white" style={{width: '80px', backgroundColor: 'black', fontWeight: 600, marginRight: '-1px'}}>Buscar</h1>
            <input id="query" list="datalist_results" onKeyUp={updateResponse} type="search" placeholder={props.placeholder} style={{display: 'inline-block', maxWidth:"50vw"}} className="form-control mr-sm-2"/>
            <button onClick={searchApi} type="button" style={{display:'inline-block', marginLeft: '-20px'}} className="btn btn-primary"><i className="fas fa-map-marker-alt"></i></button>
            <button onClick={searchApi} type="button" style={{display:'inline-block', marginLeft: '0px'}} className="btn btn-primary"><i className="fas fa-search"></i></button>
        <div className="shift_started_modal" style={{display:search.reply_places.length<=0?"none":"block"}}>
            <div className="modal-dialog" role="document">
                <div className="modal-content p-3 rounded-4 shadow">
                    <div className="modal-header border-bottom-0">
                        <h5 className="modal-title">Resultados de busqueda:</h5>
                        <svg className="remove-element btn" style={{opacity:1}} onClick={() => setSearch({...search,reply_places:[]})} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='black'>
                        <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
                        </svg>
                    </div>
                    <div className="modal-body py-0">
                        {search.reply_places}
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}

function PlaceSearchButton(props) {
    const [state, setState]=useState({
        selected:false
    })
    const lat=props.lat;
    const lng=props.lng;
    function placeSelected() {
        setState(prevState => ({ ...prevState, selected:true}));
        props.setSearch(prevState => ({ ...prevState, selected_element:[lat,lng]}))
    }
    return(
        <button className={`btn btn-block ${state.selected?"btn-primary":"btn-secondary"}`} data-lat={props.lat} data-lng={props.lng} onClick={()=>placeSelected()}>{props.place.address.label}</button>
    )
}

function MiddleModal(props) {
    const modals={
        "destinations_parameter":["Planificador de rutas",<DestinationsModal setState={props.setState} state={props.state} addToDestinations={props.addToDestinations} changeDestination={props.changeDestination}/>],
        "transportation_parameter":["¿Cómo te vas a transportar?",<TransportationModal setState={props.setState} state={props.state}/>],
        "time_parameter":["¿Cuándo quieres llegar?",<TimeModal setState={props.setState} state={props.state}/>],
        "mode_parameter":["¿Qué tan rápido quieres llegar?",<ModeModal setState={props.setState} state={props.state}/>],
        "avoid_parameter":["¿Qué quieres evitar?",<AvoidModal setState={props.setState} state={props.state}/>]
    }

    const openModal = useContext(OpenModalContext);
    return(
    <div className="shift_started_modal " id="transaction-customers-modal" style={{display: props.open?"block":"none", justifyContent: 'center', alignItems: 'center'}}>
      <div className="modal-dialog" role="document">
        <div className="modal-content p-3 rounded-4 shadow">
          <div className="modal-header border-bottom-0">
            <h5 className="modal-title">{modals[props.circleComponentId][0]}</h5>
            <svg className="remove-element btn" style={{opacity:1}} onClick={() => openModal(false)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='black'>
              <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
            </svg>
          </div>
          <div className="modal-body py-0">
            {modals[props.circleComponentId][1]}
          </div>
        </div>
      </div>
    </div>
    )    
}

function DestinationsModal(props) {
    const openModal = useContext(OpenModalContext);
    const destinations= ()=>{
        var destinations=[];
        for (let index = 0; index < props.state.destinations; index++) {
            let marker_color="text-secondary";
            if (index==0) {
                marker_color="text-primary";
            }
            else if(index==props.state.destinations.length-1){
                marker_color="text-red";
            }
            destinations.push(
            <div style={{display:"inline-block"}}>
                <i className={`fa fas-marker ${marker_color}}`}></i>
                <button className='btn btn-light'><i className="fa-solid fa-grip text-secondary"></i></button>
                <button className="btn btn-block btn-secondary">{props.state.destinations[index].name}</button>
            </div>
            );
        }
        return destinations;
    }
    return (
        <div>
            <div className="form-group">
            <SearchComponent userPosition={props.state.current_position} addToDestinations={props.addToDestinations} placeholder="Seleccionar destino"/>
            <div className="container border bg-light p-3 rounded shadow-lg m-2">
                {destinations()}
            </div>
            </div>
            <button type="button" className="btn-block btn-primary btn" onClick={()=>openModal(false)}>Listo!</button>
        </div>
    )
}

function TransportationModal(props) {
    const updateTransportation=(element)=>{
        props.setState(prevState => ({ ...prevState, transportation: element.value}));
    }
    return(
            <a>
                <input type="radio" onChange={updateTransportation} className="transportation" value="car" name="transportation" id=""/><i className="fas fa-car transportation-icon"></i>
                <input type="radio" onChange={updateTransportation} className="transportation" value="truck" name="transportation" id=""/><i className="fas fa-truck transportation-icon"></i>
                <input type="radio" onChange={updateTransportation} className="transportation" value="pedestrian" name="transportation" id=""/><i className="fas fa-walking transportation-icon"></i>
                <input type="radio" onChange={updateTransportation} className="transportation" value="bicycle" name="transportation" id=""/><i className="fas fa-bicycle transportation-icon"></i>
            </a>
    )
}

function TimeModal(props) {
    const [state, setState]=useState({
        time_type:"departureTime",
    })
    
    return(
        <div>
                <span className="icon"><i className="fas fa-tachometer-alt"></i></span>
                <h4>Tiempo:</h4>
                <input type="radio" name="time_type" value="departureTime" /> <span className="item">Salida</span>
                <input type="radio" name="time_type" value="arrivalTime" /> <span className="item">Llegada</span>
                <input id="departure-time" className="form-control" type="datetime-local" required />
            </div>
    )
}

function ModeModal(props) {
    return(
        <a>
            <span className="icon"><i className="fas fa-tachometer-alt"></i></span>
            <h4>Forma de viaje:</h4>
            <input type="radio" checked className="mode" value="none" name="mode" id=""/><span>Ninguno</span>
            <input type="radio" className="mode" value="fastest" name="mode" id=""/><span>Rápida</span>
            <input type="radio" className="mode" value="shortest" name="mode" id=""/><span>Corta</span>
        </a>
    )
}

function AvoidModal(params) {
    return (
        <a>
            <div>
                <input type="checkbox" className="avoid" value="seasonalClosure" name="avoid" id="">
                    <span>Clausura estacional</span>
                </input>
            </div>
            <div>
                <input type="checkbox" className="avoid" value="controlledAccessHighway" name="avoid" id="">
                    <span>Autopista de acceso controlado</span>
                </input>
            </div>
            <div>
                <input type="checkbox" className="avoid" value="carShuttleTrain" name="avoid" id="">
                    <span>Cruce con tren</span>
                </input>
            </div>
            <div>
                <input type="checkbox" className="avoid" value="dirtRoad" name="avoid" id="">
                    <span>Camino de tierra</span>
                </input>
            </div>
            <div>
                <input type="checkbox" className="avoid" value="uTurns" name="avoid" id="">
                    <span>Vuelta en U</span>
                </input>
            </div>
            <div>
                <input type="checkbox" className="avoid" value="difficultTurns" name="avoid" id="">
                    <span>Carretera de cobro</span>
                </input>
            </div>
            <div>
                <input type="checkbox" name="avoid" value="ferry"  className="avoid" id="">
                    <span>Ferry</span>
                </input>
            </div>
            <div>
                <input type="checkbox" name="avoid" value="tunnel" className="avoid" id="">
                    <span>Túnel</span>
                </input>
            </div>
            <div>
                <input type="checkbox" name="avoid" value="tollRoad" className="avoid" id="">
                    <span>Giros complicados</span>
                </input>
            </div>
        </a>
    )
}

function CircleComponent(props) {
    const openModal = useContext(OpenModalContext);
    var icons_clases={
        "destinations_parameter":"fas fa-map-marker-alt text-danger",
        "other_destination_parameter":"fas fa-map-marker-alt text-success",
        "to_destination_parameter":"fas fa-map-marker-alt text-primary",
        "transportation_parameter":"fas fa-car",
        "time_parameter":"fas fa-calendar",
        "mode_parameter":"fas fa-tachometer-alt",
        "avoid_parameter":"fas fa-exclamation text-warning"
    } 
    return(
        <div className="circle-component" onClick={()=> openModal(true, props.id)}>
            <i className={`${icons_clases[props.id]} menu-parameters-icons`}></i>
        </div>
    )
}
function LeftComponents({openModal}) {
    return(
        <div className="left-components">
            <CircleComponent id="transportation_parameter"/>
            <CircleComponent id="time_parameter"/>
            <CircleComponent id="mode_parameter"/>
            <CircleComponent id="avoid_parameter"/>
            <CircleComponent id="destinations_parameter"/>
        </div>
    )
}


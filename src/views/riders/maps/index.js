import React, { useState, useRef } from "react";
import useSwr from "swr";
import  GoogleMapReact  from "google-map-react";
import useSupercluster from "use-supercluster";

import "../../../App.css";

const fetcher = (...args) => fetch(...args).then((response) => response.json());



const Marker = ({ children, ...rest }) => {
  return children
};

const Maps = (props) => {
  const mapRef = useRef();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(10);
  const [selected, setSelected] = useState({});
  const [input, setInput] = useState("");

  const url = "https://getallridersapi.herokuapp.com/all-riders";
  const { data, error } = useSwr(url, { fetcher });
  const riders = data && !error ? data.slice(0, 2000) : [];

  const filteredRiders = riders.length
    ? riders.filter((rider) => rider.riderId.startsWith(input))
    : [];

  const onMarkerHover = (riderId) => {
    const riderFound = filteredRiders.find(
      (rider) => rider.riderId === riderId
    );

    setSelected(riderFound);
  };

  const points = filteredRiders.map((rider) => ({
    type: "Feature",
    properties: {
      cluster: false,
      riderId: rider.riderId,
      category: rider.category,
    },
    geometry: {
      type: "Point",
      coordinates: [
        rider.location.coordinates[0],
        rider.location.coordinates[1],
      ],
    },
  }));
  console.log(selected);
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div
        style={{
          width: "100%",
          padding: " 12px 20px",
          margin: "8px 0",
        }}
      >
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="filter by Rider's ID"
        />
        <button>Search</button>
      </div>


      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_KEY }}
        // bootstrapURLKeys={{ key: "" }}
        defaultCenter={{ lat: 5.285153, lng: 100.456238 }}
        defaultZoom={11}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map }) => {
          mapRef.current = map;
        }}
        onChange={({ zoom, bounds }) => {
          setZoom(zoom);
          setBounds([
            bounds.nw.lng,
            bounds.se.lat,
            bounds.se.lng,
            bounds.nw.lat,
          ]);
        }}
      >
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const {
            cluster: isCluster,
            point_count: pointCount,
          } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                lat={latitude}
                lng={longitude}
               
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 20}px`,
                    height: `${10 + (pointCount / points.length) * 20}px`,
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );
                    mapRef.current.setZoom(expansionZoom);
                    mapRef.current.panTo({ lat: latitude, lng: longitude });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }
          
          return (
            <Marker
              key={`rider-${cluster.properties.riderId}`}
              lat={latitude}
              lng={longitude}
              show
              hover
            >
              <div
                onMouseEnter={(e) => onMarkerHover(cluster.properties.riderId)}
                onMouseLeave={() => setSelected({})}
              >
              
                {cluster.properties.riderId === selected.riderId && (
                  <div
                    style={{
                      zIndex: 10000,
                      background: "#fff",
                      color: "#333",
                      width: 150,
                      position: "absolute",
                      bottom: "100%",
                    }}
                  >
                    <p>id: {selected.riderId}</p>
                    <p>On Duty: {selected.isDuty ? "yes" : "no"}</p>
                    <button onClick={() => setSelected({})}>Close</button>
                  </div>
                )}

                <button className="crime-marker">
                  <img src="/bike.svg" alt="riders" />
                </button>
              </div>
            </Marker>
          );
        })}
        
      </GoogleMapReact>
    
   
      
    </div>
  );
};

export default Maps;

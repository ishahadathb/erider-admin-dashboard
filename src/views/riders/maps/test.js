
import React, { useState, useEffect, useRef } from "react";
import GoogleMapReact from "google-map-react";
import axios from "axios";

const Marker = ({ children }) => children;

const Maps = (props) => {
  const {} = props;

  const mapRef = useRef();

  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(10);
  const [riderPoints, setRiderPoints] = useState(null);
  const [filterData, setFilterData] = useState(null);
  const [isSubmitFilter, setIsSubmitFilter] = useState(false);

  useEffect(() => {
    console.log("calling api when loading finished");
    getMapData();
  }, []);

  useEffect(() => {
    if (isSubmitFilter) {
      console.log("call api with filter data");
      getMapData(filterData);
    }
  }, [isSubmitFilter]);

  const getMapData = async (filterData = null) => {
    const url = "https://getallridersapi.herokuapp.com/all-riders";

    const data = await axios(url, {
      data: filterData
    });
    const result = data.data;

    const riders = result ? result.slice(0, 2000) : [];

    const points = riders.map((rider) => ({
      type: "Feature",
      properties: {
        cluster: false,
        riderId: rider.riderId,
        category: rider.category
      },
      geometry: {
        type: "Point",
        coordinates: [
          rider.location.coordinates[0],
          rider.location.coordinates[1]
        ]
      }
    }));
    setRiderPoints(point);
  };

  const submitFilterBtn = () => {
    setIsSubmitFilter(true);
    setFilterData();
  };

  console.log("rendered");

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          height: "50px",
          width: "200px",
          backgroundColor: "#fefefe",
          top: 20,
          left: "50%",
          transform: `translateY(${-50}%)`,
          zIndex: 99
        }}
      >
        <input placeholder="im the filter input" />
        <button onClick={submitFilterBtn}>Submit for filter</button>
      </div>
      <GoogleMapReact
        bootstrapURLKeys={{ key: "AIzaSyD1DZIzdYtHK0uNZPqNd544ZZrAt4E_Jiw" }}
        defaultCenter={{ lat: 5.285153, lng: 100.456238 }}
        defaultZoom={10}
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
            bounds.nw.lat
          ]);
        }}
      >
        {riderPoints &&
          riderPoints.map((cluster) => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const {
              cluster: isCluster,
              point_count: pointCount
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
                      height: `${10 + (pointCount / points.length) * 20}px`
                    }}
                    onClick={() => {
                      const expansionZoom = Math.min(
                        cluster.getClusterExpansionZoom(cluster.id),
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
              >
                <button className="crime-marker">
                  <img
                    src="https://www.bikebd.com/wp-content/uploads/2020/12/honda-cbr-150r-abs-2019.jpg"
                    style={{
                      height: "20px",
                      width: "20px"
                    }}
                    alt="riders"
                  />
                </button>
              </Marker>
            );
          })}
      </GoogleMapReact>
    </div>
  );
};

export default Maps;

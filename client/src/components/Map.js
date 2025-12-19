import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Rectangle, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';



export const SelectBoundingBox = ({ onBoundsSelected, bounds_recieved, isHost, enabled }) => {

    const [bounds, setBounds] = useState(bounds_recieved);
    const boundsRef = useRef(null); // Using a ref to store bounds value

    useEffect(() => {
        if (bounds_recieved && Object.keys(bounds_recieved).length != 0) {
            const latLngBounds = L.latLngBounds(
                [bounds_recieved.minLat, bounds_recieved.minLon],
                [bounds_recieved.maxLat, bounds_recieved.maxLon]
            );
            boundsRef.current = latLngBounds;
            setBounds(latLngBounds);
        }
    }, [bounds_recieved]);

    useMapEvents({
        mousedown(e) {
            console.log(isHost)
            if (!isHost || !enabled) return
            // Only respond to left click (button 0)
            if (e.originalEvent.button !== 0) return;

            const start = e.latlng;
            const map = e.target;

            map.dragging.disable(); // Disable panning
            map.scrollWheelZoom.disable(); // Disable zooming

            const onMouseMove = (ev) => {
                const end = ev.latlng;
                const rectangleBounds = L.latLngBounds(start, end);
                //console.log(rectangleBounds)
                const width = rectangleBounds._southWest.lat - rectangleBounds._northEast.lat;
                const height = rectangleBounds._southWest.lng - rectangleBounds._northEast.lng;
                const squareDegrees = width*height;
                //console.log(squareDegrees)
                //0.000001
                if(squareDegrees >= 0.10*0.99) {
                    return
                }
                boundsRef.current = rectangleBounds; // Store the bounds in the ref
                setBounds(rectangleBounds); // Update state to trigger re-render
            };

            const onMouseUp = () => {
                map.off('mousemove', onMouseMove);
                map.off('mouseup', onMouseUp);
                map.dragging.enable(); // Re-enable panning
                map.scrollWheelZoom.enable(); // Re-enable zooming
                const bounds = boundsRef.current
                if (bounds) {
                    const center = bounds.getCenter();
                    const res = {
                        'minLon': bounds._southWest.lng, 'minLat': bounds._southWest.lat,
                        'maxLon': bounds._northEast.lng, 'maxLat': bounds._northEast.lat
                    }

                    onBoundsSelected(res)

                }
            };

            map.on('mousemove', onMouseMove);
            map.on('mouseup', onMouseUp);
        }
    });

    return bounds && enabled ? <Rectangle bounds={bounds} pathOptions={{ color: 'blue' }} /> : null;
};



const MapSelectBox = ({ onBoundsSelected, boundsRecieved, isHost, started, setMarkerCoords, imgCoords }) => {
    const [position, setPosition] = useState(null);
    const [map, setMap] = useState(null);

    const L = require("leaflet");

    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
        iconUrl: require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png")
    });

    const targetIcon = new L.Icon({
        className: "leaflet-target-icon",
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
        iconUrl: require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
    });

    useEffect(() => {
        setMarkerCoords(position)
    }, [position])

    useEffect(() => {
        if (imgCoords && map) {
            console.log("Valid")
            map.flyTo(imgCoords, 16); // zoom level 16 or as needed
        }
    }, [imgCoords])

    const ClickMarker = ({ enabled }) => {
        useMapEvents({
            click(e) {
                if (!enabled) return
                //setMarkerCoords(e.latlng)
                setPosition(e.latlng);
            }
        });

        return position && enabled ? <Marker position={position} /> : null;
    };
    return (
        <MapContainer
            //center={[49.89600036208713, 10.885593337968672]}
            center={[40, 0]}
            zoom={3}
            style={{ width: "60%", margin: '2% 0% 2% 2%', 'border-radius': '0.75rem', 'min-height': 'inherit', }}
            worldCopyJump={false}
            maxBounds={[[85, -180], [-85, 180]]} // sets the visible bounds
            maxBoundsViscosity={1.0}
            minZoom={3}
            ref={setMap}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                noWrap={true}
                maxZoom={19}

            />
            <SelectBoundingBox onBoundsSelected={onBoundsSelected} bounds_recieved={boundsRecieved} isHost={isHost} enabled={!started} />
            <ClickMarker enabled={started} />
            {imgCoords && <Marker className position={imgCoords} icon={targetIcon} />}
        </MapContainer>
    );
};



export default MapSelectBox;
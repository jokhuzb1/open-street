import React, { useEffect, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import markerBlue from '../assets/marker-blue.png';
import markerRed from '../assets/marker-red.png';
import markerData from '../mock/data.json';

interface Marker {
  latitude: number;
  longitude: number;
  status: boolean;
  details: string;
}

const MapComponent: React.FC = () => {
  // State variables
  const [markers, setMarkers] = useState<Marker[]>(markerData.coordinates);
  const [map, setMap] = useState<Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  useEffect(() => {
    // Initialize map
    const initialMap = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: new VectorSource(),
        }),
      ],
      view: new View({
        center: fromLonLat([markers[0].longitude, markers[0].latitude]),
        zoom: 10,
      }),
    });

    const vectorLayer = initialMap.getLayers().item(1) as VectorLayer;
    const vectorSource = new VectorSource();
    vectorLayer.setSource(vectorSource);

    markers.forEach(marker => {
      const markerFeature = new Feature({
        geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
      });

      markerFeature.setStyle(new Style({
        image: new Icon({
          src: marker.status ? markerBlue : markerRed,
          scale: 0.5,
          anchor: [0.5, 1],
        }),
      }));

      vectorSource.addFeature(markerFeature);
    });

    const extent = vectorSource.getExtent();
    if (extent && extent[0] !== Infinity) {
      initialMap.getView().fit(extent, { duration: 1000 });
    }

    initialMap.on('singleclick', evt => {
      const clickedFeatures = initialMap.getFeaturesAtPixel(evt.pixel);
      if (clickedFeatures.length > 0) {
        const clickedFeature = clickedFeatures[0] as Feature;
        const geometry = clickedFeature.getGeometry();

        if (geometry instanceof Point) {
          const coordinates = geometry.getCoordinates();
          const clickedMarker = markers.find(marker =>
            fromLonLat([marker.longitude, marker.latitude]).toString() === coordinates.toString()
          );
          if (clickedMarker) {
            handleMarkerClick(clickedMarker);
          }
        }
      }
    });

    setMap(initialMap);

    return () => {
      initialMap.setTarget(undefined);
    };
  }, [markers]);

  const handleMarkerClick = (marker: Marker) => {
    setSelectedMarker(marker);
    if (map) {
      map.getView().setCenter(fromLonLat([marker.longitude, marker.latitude]));
      map.getView().setZoom(12);
    }
  };

  const closePopup = () => {
    setSelectedMarker(null);
  };

  const toggleMarkerStatus = (marker: Marker) => {
    const updatedMarker = { ...marker, status: !marker.status };
    const updatedMarkers = markers.map(m => 
      m.longitude === marker.longitude && m.latitude === marker.latitude ? updatedMarker : m
    );
    
    setMarkers(updatedMarkers);
    setSelectedMarker(updatedMarker);
    localStorage.setItem('markers', JSON.stringify(updatedMarkers)); 
  };

  return (
    <div className="relative w-full h-500">
      <div id="map" className="w-full h-full" style={{ height: '500px' }} />
      {selectedMarker && (
        <div 
          className="absolute top-0 left-0 transform translate-x-4 translate-y-4 bg-white p-4 rounded shadow z-10"
          style={{
            position: 'absolute',
            top: '50%',
            background: "#FFFF", 
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <h3 className="font-bold">Marker Details</h3>
          <p>{selectedMarker.details}</p>
          <label className="flex items-center mt-2">
            <span className="mr-2">{selectedMarker.status ? 'Active' : 'Inactive'}</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={selectedMarker.status}
                onChange={() => toggleMarkerStatus(selectedMarker)}
                className="absolute opacity-0 w-0 h-0"
              />
              <div className={`w-12 h-6 rounded-full ${selectedMarker.status ? 'bg-green-500' : 'bg-gray-300'} cursor-pointer`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${selectedMarker.status ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>
          </label>
          <button 
            onClick={closePopup} 
            className="mt-2 px-2 py-1 bg-red-500 text-white rounded"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;

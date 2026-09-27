import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navigation, Search, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerMapProps {
    latitude: number | string;
    longitude: number | string;
    radius?: number | string;
    onChange: (lat: number, lon: number) => void;
    height?: string;
    readOnly?: boolean;
}

interface SearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
    latitude,
    longitude,
    radius = 100,
    onChange,
    height = '350px',
    readOnly = false,
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);

    const numericLat = parseFloat(latitude.toString()) || -6.200000;
    const numericLon = parseFloat(longitude.toString()) || 106.816666;
    const numericRadius = parseFloat(radius.toString()) || 100;

    // Create custom pin icon using Lucide MapPin styled SVG
    const createCustomIcon = () => {
        const svgIcon = `
            <div style="
                position: relative;
                width: 38px;
                height: 38px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    position: absolute;
                    width: 38px;
                    height: 38px;
                    background-color: rgba(13, 148, 136, 0.2);
                    border-radius: 50%;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></div>
                <div style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
            </div>
        `;

        return L.divIcon({
            html: svgIcon,
            className: 'custom-map-pin',
            iconSize: [38, 38],
            iconAnchor: [19, 19],
        });
    };

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [numericLat, numericLon],
                zoom: 16,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            const icon = createCustomIcon();
            const marker = L.marker([numericLat, numericLon], {
                icon,
                draggable: !readOnly,
            }).addTo(map);

            const circle = L.circle([numericLat, numericLon], {
                color: '#0d9488',
                fillColor: '#0d9488',
                fillOpacity: 0.2,
                radius: numericRadius,
                weight: 2,
            }).addTo(map);

            if (!readOnly) {
                map.on('click', (e: L.LeafletMouseEvent) => {
                    const { lat, lng } = e.latlng;
                    onChange(lat, lng);
                });

                marker.on('dragend', () => {
                    const position = marker.getLatLng();
                    onChange(position.lat, position.lng);
                });
            }

            mapInstanceRef.current = map;
            markerRef.current = marker;
            circleRef.current = circle;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update marker, circle, and view when lat, lon, or radius change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            const latLng = L.latLng(numericLat, numericLon);
            
            markerRef.current.setLatLng(latLng);
            circleRef.current.setLatLng(latLng);
            circleRef.current.setRadius(numericRadius);

            mapInstanceRef.current.panTo(latLng, { animate: true });
        }
    }, [numericLat, numericLon, numericRadius]);

    // Handle search nominatim
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await res.json();
            setSearchResults(data || []);
            setShowResults(true);
            if (!data || data.length === 0) {
                toast.error('Lokasi tidak ditemukan');
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal mencari lokasi');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        onChange(lat, lon);
        setShowResults(false);
        setSearchQuery(result.display_name.split(',')[0]);
        toast.success(`Lokasi dipilih: ${result.display_name.split(',')[0]}`);
    };

    const handleDetectCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Browser tidak mendukung Geolocation');
            return;
        }
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange(pos.coords.latitude, pos.coords.longitude);
                toast.success('Lokasi browser berhasil didapatkan!');
                setIsDetecting(false);
            },
            (err) => {
                toast.error('Gagal mengambil lokasi: ' + err.message);
                setIsDetecting(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="space-y-3">
            {/* Search and Action Toolbar */}
            {!readOnly && (
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Cari nama jalan, kota, atau tempat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                                className="h-9 text-xs"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="h-9 px-3 border-teal-600 text-teal-600 hover:bg-teal-50"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-11 z-50 bg-popover text-popover-foreground rounded-md border shadow-lg max-h-56 overflow-y-auto p-1">
                                {searchResults.map((item) => (
                                    <div
                                        key={item.place_id}
                                        onClick={() => handleSelectResult(item)}
                                        className="p-2 text-xs hover:bg-muted cursor-pointer rounded flex items-start gap-2 border-b last:border-0"
                                    >
                                        <MapPin className="h-3.5 w-3.5 text-teal-600 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{item.display_name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDetectCurrentLocation}
                        disabled={isDetecting}
                        className="h-9 border-teal-600 text-teal-600 hover:bg-teal-50 shrink-0 text-xs"
                    >
                        <Navigation className="mr-1.5 h-3.5 w-3.5" />
                        {isDetecting ? 'Mendeteksi...' : 'Lokasi Saya'}
                    </Button>
                </div>
            )}

            {/* Map Canvas */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                <div
                    ref={mapContainerRef}
                    style={{ height, width: '100%' }}
                    className="z-0"
                />

                {/* Info Badge overlay */}
                <div className="absolute bottom-2 left-2 z-[400] bg-background/90 backdrop-blur border text-[11px] px-2.5 py-1 rounded-md shadow-sm font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                    <span>Lat: {numericLat.toFixed(6)} | Lon: {numericLon.toFixed(6)}</span>
                    <span className="text-muted-foreground border-l pl-2">Radius: {numericRadius}m</span>
                </div>
            </div>
            {!readOnly && (
                <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-teal-600" /> Klik pada peta atau geser penanda untuk menentukan titik koordinat lokasi secara presisi.
                </p>
            )}
        </div>
    );
};

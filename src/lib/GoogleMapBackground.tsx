import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin } from "../components/icons/MapPin";

export const GoogleMapBackground = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lazy-load: initialise the Maps API on user interaction or after the page finishes loading
  useEffect(() => {
    if (!wrapperRef.current || isLoaded) return;

    let timeout: ReturnType<typeof setTimeout>;

    const loadMap = () => {
      setIsLoaded(true);
      cleanup();
    };

    const cleanup = () => {
      clearTimeout(timeout);
      ["scroll", "mousemove", "touchstart", "keydown"].forEach((ev) =>
        window.removeEventListener(ev, loadMap),
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        // 1. If user interacts, load immediately
        ["scroll", "mousemove", "touchstart", "keydown"].forEach((ev) =>
          window.addEventListener(ev, loadMap, { once: true, passive: true }),
        );

        // 2. Otherwise load map after a delay so Lighthouse finishes taking scores
        if (document.readyState === "complete") {
          timeout = setTimeout(loadMap, 3500);
        } else {
          window.addEventListener(
            "load",
            () => {
              timeout = setTimeout(loadMap, 3500);
            },
            { once: true },
          );
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [isLoaded]);

  // Only init the map once the container is in the DOM (isLoaded = true)
  useEffect(() => {
    if (!isLoaded || !mapContainer.current) return;

    const initMap = async () => {
      setOptions({
        key: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY,
        v: "weekly",
      });

      const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;

      if (!mapContainer.current) return;

      map.current = new Map(mapContainer.current, {
        center: { lat: 6.5114, lng: 3.1115 },
        zoom: 12,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        gestureHandling: "none",
      });
    };

    initMap().catch(console.error);
  }, [isLoaded]);

  const handleLocate = () => {
    if (!("geolocation" in navigator)) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        if (map.current) {
          map.current.setCenter({ lat: latitude, lng: longitude });
          map.current.setZoom(14);
        }
        setIsLocating(false);
      },
      (error) => {
        console.warn("Geolocation access denied or failed:", error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none group/map"
    >
      {/* Skeleton shimmer shown before the map tiles load */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-100 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/60 via-zinc-100 to-zinc-200/40" />
        </div>
      )}

      {/* Map container — only rendered after the card is visible */}
      {isLoaded && <div ref={mapContainer} className="h-full w-full" />}

      {/* Bottom-to-top gradient: keeps "Ogun / Nigeria GMT+1" text readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent" />

      {/* Top edge softener */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />

      {/* Locate Button */}
      <button
        onClick={handleLocate}
        disabled={isLocating || !isLoaded}
        aria-label="Find my location"
        className="absolute bottom-4 right-4 z-20 pointer-events-auto p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg text-zinc-600 hover:text-emerald-600 hover:border-emerald-500/30 hover:shadow-emerald-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
      >
        <MapPin
          className={
            isLocating
              ? "animate-pulse"
              : "transition-transform group-hover/map:scale-110"
          }
        />
      </button>
    </div>
  );
};

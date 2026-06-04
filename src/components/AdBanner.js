'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const fetchAdvertisements = async () => {
  const response = await axios.get(`${apiUrl}/advertisements/active`);
  return response.data;
};

const getMediaUrl = (ad) => {
  const image = ad.imageUrl || ad.image;
  const url = typeof image === 'string' ? image : image?.url;
  if (!url) return null;
  if (url.startsWith('http')) return url;

  return url;
};

const normalizeAd = (ad) => ({
  ...ad,
  imageUrl: getMediaUrl(ad),
  isActive: ad.isActive ?? ad.is_active ?? true,
  linkUrl: ad.linkUrl || ad.link || '#',
  placement: ad.placement || ad.position,
});

const AdBanner = ({ size, position }) => {
  const { data: advertisements, isLoading, error } = useQuery({
    queryKey: ['advertisements'],
    queryFn: fetchAdvertisements,
  });

  const [currentAd, setCurrentAd] = useState(null);

  useEffect(() => {
    if (advertisements && position) {
      const adList = Array.isArray(advertisements) ? advertisements : advertisements.docs || [];
      const foundAd = adList.map(normalizeAd).find(
        (ad) => ad.placement === position && ad.isActive
      );
      setCurrentAd(foundAd);
    }
  }, [advertisements, position]);

  const getSizeClasses = () => {
    switch (size) {
      case "large":
        return "h-32 md:h-40";
      case "medium":
        return "h-24 md:h-32";
      case "small": 
        return "h-16 md:h-20";
      case "square":
        return "h-64 w-full max-w-sm";
      default:
        return "h-24";
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center ${getSizeClasses()}`}>
        <div className="text-center">
          <div className="text-primary font-bold text-lg mb-2">विज्ञापन लोड हो रहा है...</div>
        </div>
      </div>
    );
  }

  if (error) {
    // console.error("Error fetching ads:", error);
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center ${getSizeClasses()}`}>
        <div className="text-center">
          <div className="text-red-500 font-bold text-lg mb-2">विज्ञापन लोड करने में त्रुटि</div>
        </div>
      </div>
    );
  }

  if (currentAd) {
    return (
      <a
        href={currentAd.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center overflow-hidden rounded-lg ${getSizeClasses()} ${currentAd.imageUrl || currentAd.youtubeUrl ? '' : 'bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-primary/30'}`}
        style={{ cursor: 'pointer' }}
      >
        {currentAd.youtubeUrl ? (
          <iframe
            key={currentAd.id + '_video'}
            src={currentAd.youtubeUrl.replace('watch?v=', 'embed/')}
            title={currentAd.title}
            className="w-full h-full object-cover"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : currentAd.imageUrl ? (
          <img
            key={currentAd.id + '_image'}
            src={currentAd.imageUrl}
            alt={currentAd.title}
            className="w-full h-full object-contain bg-gray-50"
          />
        ) : (
          <div
            key={currentAd.id + '_placeholder'}
            className="text-center text-muted-foreground p-4"
          >
            <div className="text-primary font-bold text-lg">{currentAd.title}</div>
            <div>विज्ञापन</div>
          </div>
        )}
      </a>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center ${getSizeClasses()}`}>
      <div className="text-center">
        <div className="text-primary font-bold text-lg mb-2">विज्ञापन स्थान</div>
        <div className="text-muted-foreground text-sm">
          {size === "large" && "बड़ा बैनर विज्ञापन"}
          {size === "medium" && "मध्यम बैनर विज्ञापन"}  
          {size === "small" && "छोटा बैनर विज्ञापन"}
          {size === "square" && "वर्गाकार विज्ञापन"}
          {position === "bottom_sidebar" && "नीचे का साइडबार विज्ञापन"}
        </div>
        {position && (
          <div className="text-xs text-muted-foreground mt-1">
            स्थान: {position}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;

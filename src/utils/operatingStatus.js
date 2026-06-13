// Shared labels for venues whose operating_status is not the default "open".
// Used by VenueCard (full detail), and MapView/GPSMapView/ListView (compact badges).

export const OPERATING_STATUS_LABELS = {
  temporarily_closed: '⚠️ Currently Closed',
  seasonal_pause: '⚠️ Seasonal Closure',
  limited_service: '⚠️ Limited Service',
};

export const OPERATING_STATUS_SHORT = {
  temporarily_closed: 'Currently Closed',
  seasonal_pause: 'Seasonal Closure',
  limited_service: 'Limited Service',
};

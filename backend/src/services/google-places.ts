import axios from 'axios';

interface Competitor {
  placeId: string;
  name: string;
  address: string;
  website?: string;
  rating?: number;
  reviewCount: number;
  location: {
    lat: number;
    lng: number;
  };
}

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not configured - auto-discovery will not work');
    }
  }

  /**
   * Geocode an address to lat/lng coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: this.apiKey,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results?.length) {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  }

  /**
   * Find dental competitors within a radius
   * @param lat - Latitude
   * @param lng - Longitude
   * @param radiusMiles - Search radius in miles (default 15)
   * @param limit - Max number of competitors (default 10)
   */
  async findDentalCompetitors(
    lat: number,
    lng: number,
    radiusMiles: number = 15,
    limit: number = 10
  ): Promise<Competitor[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
    const allResults: any[] = [];
    let nextPageToken: string | undefined;

    // Fetch up to 3 pages of results (60 total)
    for (let page = 0; page < 3; page++) {
      const params: any = {
        location: `${lat},${lng}`,
        radius: radiusMeters,
        type: 'dentist',
        key: this.apiKey,
      };

      if (nextPageToken) {
        params.pagetoken = nextPageToken;
        // Google requires a short delay before using page token
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        { params }
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${response.data.status}`);
      }

      allResults.push(...(response.data.results || []));
      nextPageToken = response.data.next_page_token;

      if (!nextPageToken) break;
    }

    // Filter and sort by prominence (review count + rating)
    const competitors = await Promise.all(
      allResults
        .filter((place) => {
          // Must have a name and not be a chain we want to exclude
          const excludePatterns = ['aspen dental', 'heartland dental', 'pacific dental'];
          const nameLower = place.name.toLowerCase();
          return !excludePatterns.some((pattern) => nameLower.includes(pattern));
        })
        .map(async (place) => {
          // Get place details to get website
          let website: string | undefined;
          try {
            const details = await this.getPlaceDetails(place.place_id);
            website = details.website;
          } catch (e) {
            // Website not available
          }

          return {
            placeId: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address || '',
            website,
            rating: place.rating,
            reviewCount: place.user_ratings_total || 0,
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
          };
        })
    );

    // Sort by review count (descending) as proxy for prominence
    const sorted = competitors
      .filter((c) => c.website) // Only include those with websites
      .sort((a, b) => b.reviewCount - a.reviewCount);

    return sorted.slice(0, limit);
  }

  /**
   * Get detailed place information including website
   */
  async getPlaceDetails(placeId: string): Promise<{ website?: string; phone?: string }> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'website,formatted_phone_number',
          key: this.apiKey,
        },
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Place Details API error: ${response.data.status}`);
    }

    return {
      website: response.data.result?.website,
      phone: response.data.result?.formatted_phone_number,
    };
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  }
}

export const googlePlacesService = new GooglePlacesService();

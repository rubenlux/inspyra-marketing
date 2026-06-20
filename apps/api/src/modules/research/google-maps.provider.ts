import type { DiscoveryProvider, DiscoveryResult, RawCompany } from './discovery-provider.interface';

interface MapsAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface MapsPlace {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text: string };
  addressComponents?: MapsAddressComponent[];
}

interface MapsResponse {
  places?: MapsPlace[];
  nextPageToken?: string;
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.internationalPhoneNumber',
  'places.rating',
  'places.userRatingCount',
  'places.primaryTypeDisplayName',
  'places.addressComponents',
].join(',');

export class GoogleMapsDiscoveryProvider implements DiscoveryProvider {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      throw new Error(
        'GOOGLE_MAPS_API_KEY is not set — add it to .env or switch to DISCOVERY_PROVIDER=agentic_web_search',
      );
    }
    this.apiKey = key;
  }

  async discover(query: string, limit: number): Promise<DiscoveryResult> {
    const companies: RawCompany[] = [];
    let pageToken: string | undefined;

    while (companies.length < limit) {
      const batchSize = Math.min(20, limit - companies.length);
      const body: Record<string, unknown> = {
        textQuery: query,
        maxResultCount: batchSize,
        languageCode: 'es',
      };
      if (pageToken) body['pageToken'] = pageToken;

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Maps Places API ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = await response.json() as MapsResponse;
      const places = data.places ?? [];
      companies.push(...places.map(p => this.mapPlace(p)));

      if (!data.nextPageToken || places.length === 0) break;
      pageToken = data.nextPageToken;
    }

    return { companies, sinEvidencia: 0 };
  }

  private mapPlace(place: MapsPlace): RawCompany {
    const ciudad = this.extractComponent(place.addressComponents, ['locality', 'sublocality_level_1']);
    const provincia = this.extractComponent(place.addressComponents, ['administrative_area_level_1']);
    const pais = this.extractComponent(place.addressComponents, ['country']);

    return {
      nombreEmpresa: place.displayName.text,
      ciudad: ciudad ?? undefined,
      provincia: provincia ?? undefined,
      pais: pais ?? undefined,
      rubro: place.primaryTypeDisplayName?.text ?? undefined,
      website: place.websiteUri ?? undefined,
      telefono: place.internationalPhoneNumber ?? undefined,
      direccion: place.formattedAddress ?? undefined,
      googlePlaceId: place.id,
      googleMaps: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      source: 'google_maps',
      presenciaDigital: {
        tieneWeb: !!place.websiteUri,
        tieneSeo: false,
        tieneRedes: false,
        tieneEcommerce: false,
        tieneAgendaOnline: false,
      },
    };
  }

  private extractComponent(components: MapsAddressComponent[] | undefined, types: string[]): string | null {
    if (!components) return null;
    for (const type of types) {
      const comp = components.find(c => c.types.includes(type));
      if (comp) return comp.longText;
    }
    return null;
  }
}

const EARTH_RADIUS_KM = 6_371.0088;

export class GeoPoint {
  private constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

  static create(latitude: number, longitude: number): GeoPoint {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new RangeError('Latitude must be between -90 and 90');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new RangeError('Longitude must be between -180 and 180');
    }
    return new GeoPoint(latitude, longitude);
  }

  distanceTo(other: GeoPoint): number {
    const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
    const latitudeDelta = toRadians(other.latitude - this.latitude);
    const longitudeDelta = toRadians(other.longitude - this.longitude);
    const fromLatitude = toRadians(this.latitude);
    const toLatitude = toRadians(other.latitude);

    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
  }
}

import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import type { ViewStyle } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONT_SIZE, ROLE_COLORS, SPACING } from "../../constants/theme";
import { useAppContext } from "../../context/AppContext";
import type { ShelterResource } from "../../types";

type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

type ShelterWithDistance = ShelterResource & {
  gpsDistanceKm?: number;
  displayDistance: string;
};

const mapPinPositions: ViewStyle[] = [
  { top: 28, left: 48 },
  { bottom: 28, right: 56 },
  { top: 42, right: 110 },
  { bottom: 42, left: 96 },
];

const toRadians = (degree: number) => (degree * Math.PI) / 180;

const calculateDistanceKm = (
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
) => {
  const earthRadiusKm = 6371;
  const latitudeDifference = toRadians(secondLatitude - firstLatitude);
  const longitudeDifference = toRadians(secondLongitude - firstLongitude);

  const firstLatitudeRad = toRadians(firstLatitude);
  const secondLatitudeRad = toRadians(secondLatitude);

  const haversineValue =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(firstLatitudeRad) *
      Math.cos(secondLatitudeRad) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle;
};

const formatDistance = (distanceKm: number) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
};

const formatTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const openExternalMap = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Map could not open",
      "Please check that Google Maps or a browser is available on this device.",
    );
  }
};

const buildShelterMapUrl = (shelter: ShelterResource) =>
  `https://www.google.com/maps/search/?api=1&query=${shelter.latitude},${shelter.longitude}`;

const buildNavigationUrl = (shelter: ShelterResource, userLocation: UserLocation | null) => {
  const destination = `${shelter.latitude},${shelter.longitude}`;

  if (userLocation) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
};

export default function NearbySheltersScreen() {
  const router = useRouter();
  const { publishedShelters } = useAppContext();

  const locationWatcher = useRef<Location.LocationSubscription | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "GPS is not active yet. Tap the button below to calculate distance from your live location.",
  );
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const stopLocationTracking = useCallback(() => {
    locationWatcher.current?.remove();
    locationWatcher.current = null;
    setIsTrackingLocation(false);
    setLocationMessage("GPS tracking stopped. Tap the button to use your live location again.");
  }, []);

  const startLocationTracking = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      setLocationMessage("Requesting location permission...");

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setLocationMessage(
          "Location permission was not granted. Enable location permission to calculate distance.",
        );
        setUserLocation(null);
        setIsTrackingLocation(false);
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
        accuracy: currentPosition.coords.accuracy,
        updatedAt: new Date(currentPosition.timestamp).toISOString(),
      });

      setLocationMessage("Live GPS tracking is active.");
      setIsTrackingLocation(true);

      locationWatcher.current?.remove();

      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            updatedAt: new Date(position.timestamp).toISOString(),
          });
          setLocationMessage("Live GPS tracking is active.");
          setIsTrackingLocation(true);
        },
      );
    } catch {
      setLocationMessage(
        "GPS could not be started. Check your device location settings and try again.",
      );
      setIsTrackingLocation(false);
    } finally {
      setIsLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      locationWatcher.current?.remove();
    };
  }, []);

  const shelters = useMemo<ShelterWithDistance[]>(
    () =>
      publishedShelters
        .map<ShelterWithDistance>((shelter) => {
          if (userLocation) {
            const gpsDistanceKm = calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              shelter.latitude,
              shelter.longitude,
            );

            return {
              ...shelter,
              gpsDistanceKm,
              displayDistance: formatDistance(gpsDistanceKm),
            };
          }

          return {
            ...shelter,
            gpsDistanceKm: undefined,
            displayDistance: "Enable GPS for distance",
          };
        })
        .sort((first, second) => {
          if (
            typeof first.gpsDistanceKm === "number" &&
            typeof second.gpsDistanceKm === "number"
          ) {
            return first.gpsDistanceKm - second.gpsDistanceKm;
          }

          return first.name.localeCompare(second.name);
        }),
    [publishedShelters, userLocation],
  );

  const openShelterCount = shelters.filter((shelter) => shelter.status === "Open").length;
  const availableBeds = shelters.reduce(
    (total, shelter) => total + shelter.availableBeds,
    0,
  );

  const openNearestShelterMap = () => {
    if (shelters.length === 0) {
      Alert.alert(
        "No RescueBridge shelter available",
        "No shelter has been published as available by the organization.",
      );
      return;
    }

    openExternalMap(buildShelterMapUrl(shelters[0]));
  };

  const openShelterNavigation = (shelter: ShelterResource) => {
    openExternalMap(buildNavigationUrl(shelter, userLocation));
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Nearby Shelters" }} />

      <SectionTitle
        title="Nearby Shelters"
        subtitle="Only shelters published inside RescueBridge by an organization or admin appear here."
      />

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{shelters.length}</Text>
          <Text style={styles.summaryLabel}>Published shelters</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{openShelterCount}</Text>
          <Text style={styles.summaryLabel}>Open now</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{availableBeds}</Text>
          <Text style={styles.summaryLabel}>Beds available</Text>
        </Card>
      </View>

      <Card
        accentColor={isTrackingLocation ? COLORS.success : ROLE_COLORS.affected.main}
        style={isTrackingLocation ? styles.gpsActiveCard : styles.gpsCard}
      >
        <View style={styles.gpsHeader}>
          <View style={styles.gpsTitleWrap}>
            <Text style={styles.gpsTitle}>Live GPS location</Text>
            <Text style={styles.gpsMessage}>{locationMessage}</Text>
          </View>

          <Text style={styles.gpsIcon}>{isTrackingLocation ? "📍" : "🛰️"}</Text>
        </View>

        {userLocation ? (
          <View style={styles.locationGrid}>
            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>Latitude</Text>
              <Text style={styles.locationValue}>{userLocation.latitude.toFixed(5)}</Text>
            </View>

            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>Longitude</Text>
              <Text style={styles.locationValue}>{userLocation.longitude.toFixed(5)}</Text>
            </View>

            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>Accuracy</Text>
              <Text style={styles.locationValue}>
                {userLocation.accuracy ? `${Math.round(userLocation.accuracy)} m` : "Unknown"}
              </Text>
            </View>

            <View style={styles.locationBox}>
              <Text style={styles.locationLabel}>Updated</Text>
              <Text style={styles.locationValue}>{formatTime(userLocation.updatedAt)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.gpsButtonRow}>
          <AppButton
            title={isTrackingLocation ? "Refresh GPS Location" : "Use My GPS Location"}
            onPress={startLocationTracking}
            loading={isLocationLoading}
            variant={isTrackingLocation ? "success" : "danger"}
            style={styles.gpsButton}
          />

          {isTrackingLocation ? (
            <AppButton
              title="Stop"
              onPress={stopLocationTracking}
              variant="outline"
              style={styles.stopButton}
            />
          ) : null}
        </View>
      </Card>

      <Card
        onPress={openNearestShelterMap}
        accentColor={ROLE_COLORS.affected.main}
        style={styles.mapCard}
      >
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.mapTitle}>RescueBridge shelter map</Text>
            <Text style={styles.mapSubtitle}>
              Tap this card to open the nearest app-published shelter in Google Maps.
            </Text>
          </View>

          <Text style={styles.mapIcon}>🗺️</Text>
        </View>

        <View style={styles.mapPreview}>
          {shelters.slice(0, 4).map((shelter, index) => (
            <View
              key={shelter.id}
              style={[
                styles.mapPin,
                mapPinPositions[index] ?? mapPinPositions[0],
                shelter.status === "Open" ? styles.openPin : styles.limitedPin,
              ]}
            >
              <Text style={styles.pinText}>{index + 1}</Text>
            </View>
          ))}

          <View style={styles.locationDot} />
          <Text style={styles.mapCenterText}>
            {userLocation ? "Your GPS location" : "Your area"}
          </Text>
        </View>

        <Text style={styles.mapNote}>
          This screen does not search all public Google shelters. It only shows shelter records published inside RescueBridge.
        </Text>
      </Card>

      {shelters.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No published RescueBridge shelters"
          message="No organization has published an available shelter right now. A shelter appears here only when it is published, has available beds, and is Open or Limited."
          actionTitle="Request Shelter Help"
          onAction={() => router.push("/affected/submit-help" as any)}
        />
      ) : (
        shelters.map((shelter, index) => (
          <ShelterCard
            key={shelter.id}
            shelter={shelter}
            position={index + 1}
            isGpsEnabled={Boolean(userLocation)}
            onNavigate={() => openShelterNavigation(shelter)}
          />
        ))
      )}

      <AppButton
        title="Back to Affected Dashboard"
        onPress={() => router.push("/affected" as any)}
        variant="secondary"
      />
    </Screen>
  );
}

function ShelterCard({
  shelter,
  position,
  isGpsEnabled,
  onNavigate,
}: {
  shelter: ShelterWithDistance;
  position: number;
  isGpsEnabled: boolean;
  onNavigate: () => void;
}) {
  const isOpen = shelter.status === "Open";
  const isLimited = shelter.status === "Limited";

  return (
    <Card
      onPress={onNavigate}
      accentColor={
        isOpen ? COLORS.success : isLimited ? COLORS.warning : COLORS.emergency
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{position}</Text>
        </View>

        <View style={styles.cardTitleWrap}>
          <Text style={styles.shelterName}>{shelter.name}</Text>
          <Text style={styles.address}>
            {shelter.address}, {shelter.city}
          </Text>
        </View>

        <StatusBadge label={shelter.status} />
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>
            {isGpsEnabled && typeof shelter.gpsDistanceKm === "number"
              ? "GPS Distance"
              : "Distance"}
          </Text>
          <Text style={styles.detailValue}>{shelter.displayDistance}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Available beds</Text>
          <Text style={styles.detailValue}>
            {shelter.availableBeds} / {shelter.totalCapacity}
          </Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Food units</Text>
          <Text style={styles.detailValue}>{shelter.foodSupport}</Text>
        </View>

        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>Water units</Text>
          <Text style={styles.detailValue}>{shelter.waterSupport}</Text>
        </View>
      </View>

      <Card style={styles.innerCard}>
        <Text style={styles.innerTitle}>Published shelter update</Text>
        <Text style={styles.innerText}>Medical: {shelter.medicalSupport}</Text>
        <Text style={styles.innerText}>Supplies: {shelter.supplies}</Text>
        <Text style={styles.innerText}>Phone: {shelter.contactNumber}</Text>
        <Text style={styles.innerText}>Hours: {shelter.operatingHours}</Text>
        <Text style={styles.innerText}>Updated: {formatDateTime(shelter.updatedAt)}</Text>
      </Card>

      <View style={styles.navigationHint}>
        <Text style={styles.navigationHintText}>
          Tap this RescueBridge shelter to start Google Maps navigation
        </Text>
        <Text style={styles.navigationIcon}>↗</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.md,
  },
  summaryNumber: {
    color: ROLE_COLORS.affected.main,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    textAlign: "center",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    textAlign: "center",
    marginTop: 2,
  },
  gpsCard: {
    backgroundColor: COLORS.emergencyLight,
  },
  gpsActiveCard: {
    backgroundColor: COLORS.successLight,
  },
  gpsHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  gpsTitleWrap: {
    flex: 1,
  },
  gpsTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  gpsMessage: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: 3,
  },
  gpsIcon: {
    fontSize: 30,
  },
  locationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  locationBox: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
  },
  locationLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  locationValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  gpsButtonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  gpsButton: {
    flex: 1,
  },
  stopButton: {
    width: 92,
  },
  mapCard: {
    backgroundColor: COLORS.primaryLight,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  mapTitle: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  mapSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  mapIcon: {
    fontSize: 30,
  },
  mapPreview: {
    height: 150,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 18,
    marginTop: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mapPin: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderColor: COLORS.white,
    borderWidth: 3,
  },
  openPin: {
    backgroundColor: COLORS.success,
  },
  limitedPin: {
    backgroundColor: COLORS.warning,
  },
  pinText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  locationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.white,
    borderWidth: 3,
  },
  mapCenterText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    marginTop: SPACING.xs,
  },
  mapNote: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ROLE_COLORS.affected.light,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: ROLE_COLORS.affected.main,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
  cardTitleWrap: {
    flex: 1,
  },
  shelterName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
  address: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 17,
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  detailBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailValue: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
    marginTop: SPACING.xs,
    fontWeight: "700",
  },
  innerCard: {
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: 0,
    marginTop: SPACING.md,
  },
  innerTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    marginBottom: SPACING.sm,
  },
  innerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: 2,
  },
  navigationHint: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "#90CAF9",
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  navigationHintText: {
    flex: 1,
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
  },
  navigationIcon: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
  },
});
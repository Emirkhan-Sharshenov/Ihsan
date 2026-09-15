import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass, LocateFixed, MapPin, Navigation } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useLanguage } from '@/hooks/useLanguage';

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function getQiblaDirection(lat: number, lon: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const dLambda = toRad(KAABA_LON - lon);

  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getDistance(lat: number, lon: number): number {
  const R = 6371;
  const dLat = toRad(KAABA_LAT - lat);
  const dLon = toRad(KAABA_LON - lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Low-pass filter smooths raw magnetometer jitter into a usable compass heading.
function magnetometerToHeading(x: number, y: number): number {
  let angle = toDeg(Math.atan2(y, x));
  angle = (angle + 360) % 360;
  // Screen-facing convention: 0 = North when the phone lies flat, facing up.
  return (90 - angle + 360) % 360;
}

type LocationState = {
  status: 'idle' | 'loading' | 'granted' | 'denied';
  lat?: number;
  lon?: number;
};

type CompassState = {
  available: boolean;
  heading: number;
};

export default function QiblaScreen() {
  const { t, lang } = useLanguage();
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const [compass, setCompass] = useState<CompassState>({ available: false, heading: 0 });
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const smoothedHeading = useRef<number | null>(null);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const resolveLocation = async () => {
    setLocation({ status: 'loading' });

    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocation({ status: 'denied' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ status: 'granted', lat: latitude, lon: longitude });
          setQiblaAngle(getQiblaDirection(latitude, longitude));
          setDistance(getDistance(latitude, longitude));
          triggerHaptic();
        },
        () => setLocation({ status: 'denied' }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({ status: 'denied' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setLocation({ status: 'granted', lat: latitude, lon: longitude });
      setQiblaAngle(getQiblaDirection(latitude, longitude));
      setDistance(getDistance(latitude, longitude));
      triggerHaptic();
    } catch {
      setLocation({ status: 'denied' });
    }
  };

  useEffect(() => {
    resolveLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Native compass: real device magnetometer via expo-sensors.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    Magnetometer.isAvailableAsync().then((available) => {
      if (!available || cancelled) return;
      Magnetometer.setUpdateInterval(120);
      subscription = Magnetometer.addListener(({ x, y }) => {
        const raw = magnetometerToHeading(x, y);
        const prev = smoothedHeading.current;
        // Smooth across the 0/360 wrap so the needle doesn't spin the long way round.
        let next = raw;
        if (prev !== null) {
          let delta = raw - prev;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          next = (prev + delta * 0.25 + 360) % 360;
        }
        smoothedHeading.current = next;
        setCompass({ available: true, heading: next });
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  // Web fallback: DeviceOrientationEvent (works in mobile browsers only).
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (event: DeviceOrientationEvent) => {
      let heading = 0;
      if (typeof (event as unknown as { webkitCompassHeading?: number }).webkitCompassHeading === 'number') {
        heading = (event as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
      } else if (event.alpha !== null) {
        heading = (360 - event.alpha) % 360;
      }
      setCompass({ available: true, heading });
    };

    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, []);

  const relativeAngle = qiblaAngle !== null ? (qiblaAngle - compass.heading + 360) % 360 : 0;
  const wrappedDelta = Math.min(relativeAngle, 360 - relativeAngle);
  const isAligned = qiblaAngle !== null && wrappedDelta < 5;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#153957', '#071526']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t.qiblaEyebrow}</Text>
            <Text style={styles.title}>{t.qiblaTitle}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Compass color="#A9F06B" size={22} />
          </View>
        </View>

        {location.status === 'denied' ? (
          <View style={styles.centerContent}>
            <View style={styles.deniedIcon}>
              <LocateFixed color="#7890A6" size={40} />
            </View>
            <Text style={styles.deniedText}>{t.qiblaLocationDenied}</Text>
            <Pressable style={styles.enableButton} onPress={resolveLocation}>
              <LocateFixed color="#0A1C31" size={18} />
              <Text style={styles.enableButtonText}>{t.qiblaEnableLocation}</Text>
            </Pressable>
          </View>
        ) : location.status === 'loading' ? (
          <View style={styles.centerContent}>
            <View style={styles.loadingRing}>
              <View style={styles.loadingInner} />
            </View>
            <Text style={styles.loadingText}>{t.qiblaFindingLocation}</Text>
          </View>
        ) : qiblaAngle !== null ? (
          <>
            <View style={styles.compassWrap}>
              <View style={[styles.compassOuter, isAligned && styles.compassAligned]}>
                {compass.available && (
                  <View
                    style={[styles.compassNeedle, { transform: [{ rotate: `${relativeAngle}deg` }] }]}
                  >
                    <View style={styles.needleTop} />
                    <View style={styles.needleBottom} />
                  </View>
                )}
                <Text style={styles.compassN}>N</Text>
                <Text style={styles.compassS}>S</Text>
                <Text style={styles.compassE}>E</Text>
                <Text style={styles.compassW}>W</Text>
                <View style={styles.compassCenter} />
              </View>
              {isAligned && <Text style={styles.alignedText}>{t.qiblaKaaba} ↩</Text>}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Navigation color="#A9F06B" size={18} />
                <Text style={styles.infoLabel}>{t.qiblaQiblaDirection}</Text>
                <Text style={styles.infoValue}>{Math.round(qiblaAngle)}{t.qiblaDegrees}</Text>
              </View>
              {distance !== null && (
                <View style={styles.infoRow}>
                  <MapPin color="#A9F06B" size={18} />
                  <Text style={styles.infoLabel}>{t.qiblaDistance}</Text>
                  <Text style={styles.infoValue}>
                    {distance.toLocaleString(lang === 'ky' ? 'ky-KG' : 'ru-RU')} {lang === 'ky' ? 'км' : 'км'}
                  </Text>
                </View>
              )}
              {location.lat !== undefined && location.lon !== undefined && (
                <View style={styles.infoRow}>
                  <LocateFixed color="#A9F06B" size={18} />
                  <Text style={styles.infoLabel}>{t.qiblaYourLocation}</Text>
                  <Text style={styles.infoValue}>
                    {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {!compass.available && (
              <Text style={styles.hintText}>{t.qiblaAlignPhone}</Text>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071526' },
  content: { padding: 24, paddingTop: 60, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#A9F06B', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: '#F4F8FC', fontSize: 30, fontWeight: '700', marginTop: 9 },
  headerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  deniedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D', marginBottom: 20 },
  deniedText: { color: '#849AAF', fontSize: 16, textAlign: 'center', marginBottom: 24, paddingHorizontal: 30 },
  enableButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#A9F06B', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 },
  enableButtonText: { color: '#0A1C31', fontWeight: '700', fontSize: 15 },
  loadingRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: '#31506D', borderTopColor: '#A9F06B' },
  loadingInner: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#A9F06B', opacity: 0.3 },
  loadingText: { color: '#849AAF', fontSize: 14, marginTop: 20 },
  compassWrap: { alignItems: 'center', marginTop: 40 },
  compassOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#10243C',
    borderWidth: 2,
    borderColor: '#31506D',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassAligned: { borderColor: '#A9F06B', shadowColor: '#A9F06B', shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  compassNeedle: {
    position: 'absolute',
    width: 4,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleTop: {
    width: 4,
    height: 100,
    backgroundColor: '#A9F06B',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  needleBottom: {
    width: 4,
    height: 100,
    backgroundColor: '#526B82',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  compassN: { position: 'absolute', top: 16, color: '#A9F06B', fontSize: 16, fontWeight: '700' },
  compassS: { position: 'absolute', bottom: 16, color: '#526B82', fontSize: 14, fontWeight: '600' },
  compassE: { position: 'absolute', right: 16, color: '#526B82', fontSize: 14, fontWeight: '600' },
  compassW: { position: 'absolute', left: 16, color: '#526B82', fontSize: 14, fontWeight: '600' },
  compassCenter: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#A9F06B', zIndex: 1 },
  alignedText: { color: '#A9F06B', fontSize: 16, fontWeight: '700', marginTop: 20 },
  infoCard: { backgroundColor: '#10243C', borderRadius: 20, borderWidth: 1, borderColor: '#203D5A', padding: 20, marginTop: 36 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  infoLabel: { flex: 1, color: '#849AAF', fontSize: 14 },
  infoValue: { color: '#F4F8FC', fontSize: 15, fontWeight: '700' },
  hintText: { color: '#72889C', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 18, paddingHorizontal: 20 },
});

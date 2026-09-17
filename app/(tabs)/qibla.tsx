import { useCallback, useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { Compass, LocateFixed, MapPin, Navigation } from 'lucide-react-native';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Coordinates, Qibla } from 'adhan';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { requestGpsCoords } from '@/hooks/usePrayerTimes';

const KAABA = { lat: 21.4225, lon: 39.8262 };
const ALIGN_TOLERANCE = 5;
const DIAL = 280;

const toRad = (deg: number) => (deg * Math.PI) / 180;

function distanceKm(lat: number, lon: number): number {
  const dLat = toRad(KAABA.lat - lat);
  const dLon = toRad(KAABA.lon - lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Signed smallest difference target - current in (-180, 180].
function angleDelta(target: number, current: number): number {
  let d = (target - current) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

type LocationState = { status: 'loading' | 'granted' | 'denied'; lat?: number; lon?: number };
type HeadingState = { available: boolean; heading: number; lowAccuracy: boolean };

export default function QiblaScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [location, setLocation] = useState<LocationState>({ status: 'loading' });
  const [compass, setCompass] = useState<HeadingState>({ available: false, heading: 0, lowAccuracy: false });
  const smoothed = useRef<number | null>(null);
  const wasAligned = useRef(false);

  const resolveLocation = useCallback(async () => {
    setLocation({ status: 'loading' });
    const coords = await requestGpsCoords();
    setLocation(coords ? { status: 'granted', ...coords } : { status: 'denied' });
  }, []);

  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  const onHeading = useCallback((raw: number, lowAccuracy: boolean) => {
    const prev = smoothed.current;
    const next = prev === null ? raw : (prev + angleDelta(raw, prev) * 0.3 + 360) % 360;
    smoothed.current = next;
    setCompass({ available: true, heading: next, lowAccuracy });
  }, []);

  // Native: expo-location heading. `trueHeading` is corrected for magnetic declination, which matters
  // because the qibla bearing is relative to true north (the difference is ~4° in Bishkek, ~11° in Moscow).
  useEffect(() => {
    if (Platform.OS === 'web' || !isFocused || location.status !== 'granted') return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const heading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      // Android reports accuracy as a 0–3 level, iOS as an error in degrees.
      onHeading(heading, Platform.OS === 'android' ? h.accuracy < 2 : h.accuracy < 0 || h.accuracy > 25);
    })
      .then((sub) => {
        if (cancelled) sub.remove();
        else subscription = sub;
      })
      .catch(() => setCompass((c) => ({ ...c, available: false })));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [isFocused, location.status, onHeading]);

  // Web fallback for mobile browsers.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = (event: DeviceOrientationEvent) => {
      const webkit = (event as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkit === 'number') onHeading(webkit, false);
      else if (event.absolute && event.alpha !== null) onHeading((360 - event.alpha) % 360, false);
    };
    window.addEventListener('deviceorientationabsolute' as 'deviceorientation', handler, true);
    window.addEventListener('deviceorientation', handler, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute' as 'deviceorientation', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, [onHeading]);

  const hasLocation = location.status === 'granted' && location.lat !== undefined && location.lon !== undefined;
  const qibla = hasLocation ? Qibla(new Coordinates(location.lat!, location.lon!)) : null;
  const delta = qibla !== null && compass.available ? angleDelta(qibla, compass.heading) : null;
  const isAligned = delta !== null && Math.abs(delta) <= ALIGN_TOLERANCE;

  useEffect(() => {
    if (isAligned && !wasAligned.current && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasAligned.current = isAligned;
  }, [isAligned]);

  const dialRotation = compass.available ? -compass.heading : 0;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#153957', colors.bg]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t.qiblaEyebrow}</Text>
            <Text style={styles.title}>{t.qiblaTitle}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Compass color={colors.accent} size={22} />
          </View>
        </View>

        {location.status === 'denied' ? (
          <View style={styles.centerContent}>
            <View style={styles.deniedIcon}>
              <LocateFixed color="#7890A6" size={40} />
            </View>
            <Text style={styles.deniedText}>{t.qiblaLocationDenied}</Text>
            <Pressable style={styles.enableButton} onPress={resolveLocation}>
              <LocateFixed color={colors.accentDark} size={18} />
              <Text style={styles.enableButtonText}>{t.qiblaEnableLocation}</Text>
            </Pressable>
          </View>
        ) : location.status === 'loading' || qibla === null ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>{t.qiblaFindingLocation}</Text>
          </View>
        ) : (
          <>
            <View style={styles.compassWrap}>
              {/* Fixed pointer at the top: the direction the phone is facing. */}
              <View style={[styles.pointer, isAligned && styles.pointerAligned]} />
              <View style={[styles.dial, isAligned && styles.dialAligned, { transform: [{ rotate: `${dialRotation}deg` }] }]}>
                {[0, 90, 180, 270].map((deg) => (
                  <View key={deg} style={[styles.cardinalWrap, { transform: [{ rotate: `${deg}deg` }] }]}>
                    <Text style={[styles.cardinal, deg === 0 && styles.cardinalNorth]}>{lang === 'ky' ? ['Түн', 'Чыг', 'Түш', 'Бат'][deg / 90] : ['С', 'В', 'Ю', 'З'][deg / 90]}</Text>
                  </View>
                ))}
                {Array.from({ length: 72 }).map((_, i) => (
                  <View key={i} style={[styles.tickWrap, { transform: [{ rotate: `${i * 5}deg` }] }]}>
                    <View style={[styles.tick, i % 6 === 0 && styles.tickMajor]} />
                  </View>
                ))}
                <View style={[styles.qiblaNeedleWrap, { transform: [{ rotate: `${qibla}deg` }] }]}>
                  <View style={styles.kaabaIcon}>
                    <View style={styles.kaabaBand} />
                  </View>
                  <View style={styles.qiblaNeedle} />
                </View>
                <View style={styles.center} />
              </View>
            </View>

            <Text style={[styles.turnText, isAligned && styles.turnTextAligned]}>
              {!compass.available
                ? t.qiblaNoCompass.replace('{deg}', String(Math.round(qibla)))
                : isAligned
                  ? t.qiblaAligned
                  : delta! > 0
                    ? t.qiblaTurnRight.replace('{n}', String(Math.round(delta!)))
                    : t.qiblaTurnLeft.replace('{n}', String(Math.round(-delta!)))}
            </Text>
            {compass.lowAccuracy ? <Text style={styles.warning}>{t.qiblaLowAccuracy}</Text> : null}

            <View style={styles.infoCard}>
              <InfoRow icon={<Navigation color={colors.accent} size={18} />} label={t.qiblaDirection} value={`${Math.round(qibla)}° ${t.qiblaFromNorth}`} />
              <InfoRow
                icon={<MapPin color={colors.accent} size={18} />}
                label={t.qiblaDistance}
                value={`${distanceKm(location.lat!, location.lon!).toLocaleString('ru-RU')} ${t.qiblaKm}`}
              />
              <InfoRow
                icon={<LocateFixed color={colors.accent} size={18} />}
                label={t.qiblaYourLocation}
                value={`${location.lat!.toFixed(3)}, ${location.lon!.toFixed(3)}`}
              />
            </View>
            <Text style={styles.hintText}>{t.qiblaCalibrate}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 22, paddingBottom: 32, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: colors.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '700', marginTop: 9 },
  headerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  deniedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#18344F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#31506D', marginBottom: 20 },
  deniedText: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20, lineHeight: 21 },
  enableButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24 },
  enableButtonText: { color: colors.accentDark, fontWeight: '700', fontSize: 15 },
  loadingText: { color: colors.textMuted, fontSize: 14, marginTop: 20 },
  compassWrap: { alignItems: 'center', marginTop: 30 },
  pointer: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#EAF4FF', marginBottom: 6 },
  pointerAligned: { borderTopColor: colors.accent },
  dial: { width: DIAL, height: DIAL, borderRadius: DIAL / 2, backgroundColor: colors.card, borderWidth: 2, borderColor: '#31506D', alignItems: 'center', justifyContent: 'center' },
  dialAligned: { borderColor: colors.accent },
  cardinalWrap: { position: 'absolute', width: DIAL, height: DIAL, alignItems: 'center', paddingTop: 22 },
  cardinal: { color: '#7890A6', fontSize: 15, fontWeight: '700' },
  cardinalNorth: { color: '#F58B8B' },
  tickWrap: { position: 'absolute', width: DIAL, height: DIAL, alignItems: 'center', paddingTop: 4 },
  tick: { width: 1, height: 6, backgroundColor: '#31506D' },
  tickMajor: { width: 2, height: 11, backgroundColor: '#50677D' },
  qiblaNeedleWrap: { position: 'absolute', width: DIAL, height: DIAL, alignItems: 'center', paddingTop: 44 },
  kaabaIcon: { width: 26, height: 26, backgroundColor: '#111', borderRadius: 3, borderWidth: 1, borderColor: '#D4AF37', justifyContent: 'flex-start' },
  kaabaBand: { height: 4, marginTop: 6, backgroundColor: '#D4AF37' },
  qiblaNeedle: { width: 4, height: DIAL / 2 - 70, backgroundColor: colors.accent, borderRadius: 2 },
  center: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent },
  turnText: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 22, lineHeight: 23 },
  turnTextAligned: { color: colors.accent },
  warning: { color: '#E8CE9A', fontSize: 12, textAlign: 'center', marginTop: 8 },
  infoCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18, paddingVertical: 8, marginTop: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  infoLabel: { flex: 1, color: colors.textMuted, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  hintText: { color: colors.textMutedDark, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});

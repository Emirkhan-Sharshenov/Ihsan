import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Infinity as InfinityIcon, LocateFixed, MapPin, Navigation, RefreshCw, Ruler, SlidersHorizontal } from 'lucide-react-native';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Coordinates, Qibla } from 'adhan';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, PrimaryButton, ScreenBackground, ScreenHeader, type } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { requestGpsCoords } from '@/hooks/usePrayerTimes';

const KAABA = { lat: 21.4225, lon: 39.8262 };
const ALIGN_TOLERANCE = 5;
const DIAL = 290;

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
type HeadingState = { available: boolean; heading: number; lowAccuracy: boolean; declination: number | null };

export default function QiblaScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [location, setLocation] = useState<LocationState>({ status: 'loading' });
  const [compass, setCompass] = useState<HeadingState>({ available: false, heading: 0, lowAccuracy: false, declination: null });
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

  const onHeading = useCallback((raw: number, lowAccuracy: boolean, declination: number | null) => {
    const prev = smoothed.current;
    const next = prev === null ? raw : (prev + angleDelta(raw, prev) * 0.3 + 360) % 360;
    smoothed.current = next;
    setCompass({ available: true, heading: next, lowAccuracy, declination });
  }, []);

  // Native: expo-location heading. `trueHeading` is corrected for magnetic declination, which matters
  // because the qibla bearing is relative to true north (the difference is ~4° in Bishkek, ~11° in Moscow).
  useEffect(() => {
    if (Platform.OS === 'web' || !isFocused || location.status !== 'granted') return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      const hasTrue = h.trueHeading >= 0;
      const heading = hasTrue ? h.trueHeading : h.magHeading;
      const declination = hasTrue ? angleDelta(h.trueHeading, h.magHeading) : null;
      // Android reports accuracy as a 0–3 level, iOS as an error in degrees.
      onHeading(heading, Platform.OS === 'android' ? h.accuracy < 2 : h.accuracy < 0 || h.accuracy > 25, declination);
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
      if (typeof webkit === 'number') onHeading(webkit, false, null);
      else if (event.absolute && event.alpha !== null) onHeading((360 - event.alpha) % 360, false, null);
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
  const cardinals = lang === 'ky' ? ['Түн', 'Чыг', 'Түш', 'Бат'] : ['С', 'В', 'Ю', 'З'];

  return (
    <View style={styles.screen}>
      <ScreenBackground />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.qiblaTitle} />

        {location.status === 'denied' ? (
          <View style={styles.centerContent}>
            <View style={styles.deniedIcon}>
              <LocateFixed color={colors.textMuted} size={40} />
            </View>
            <Text style={[type.muted, styles.deniedText]}>{t.qiblaLocationDenied}</Text>
            <PrimaryButton label={t.qiblaEnableLocation} onPress={resolveLocation} icon={<LocateFixed color={colors.accentDark} size={18} />} />
          </View>
        ) : location.status === 'loading' || qibla === null ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={[type.muted, { marginTop: 20 }]}>{t.qiblaFindingLocation}</Text>
          </View>
        ) : (
          <>
            <View style={styles.locationChip}>
              <LocateFixed color={colors.accent} size={15} />
              <Text style={styles.locationChipText}>
                {location.lat!.toFixed(3)}, {location.lon!.toFixed(3)} · {t.qiblaGpsActive}
              </Text>
            </View>

            <View style={styles.compassWrap}>
              {/* Fixed pointer at the top: the direction the phone is facing. */}
              <Navigation color={isAligned ? colors.accent : colors.text} fill={isAligned ? colors.accent : 'transparent'} size={30} />
              <View style={[styles.pointerStem, isAligned && { backgroundColor: colors.accent }]} />
              <View style={[styles.dial, isAligned && styles.dialAligned]}>
                <View style={[styles.dialRotor, { transform: [{ rotate: `${dialRotation}deg` }] }]}>
                  {Array.from({ length: 72 }).map((_, i) => (
                    <View key={i} style={[styles.tickWrap, { transform: [{ rotate: `${i * 5}deg` }] }]}>
                      <View style={[styles.tick, i % 18 === 0 ? styles.tickCardinal : i % 6 === 0 && styles.tickMajor]} />
                    </View>
                  ))}
                  {[0, 90, 180, 270].map((deg, i) => (
                    <View key={deg} style={[styles.cardinalWrap, { transform: [{ rotate: `${deg}deg` }] }]}>
                      <Text style={[styles.cardinal, deg === 0 && styles.cardinalNorth]}>{cardinals[i]}</Text>
                    </View>
                  ))}
                  <View style={[styles.qiblaNeedleWrap, { transform: [{ rotate: `${qibla}deg` }] }]}>
                    <View style={styles.kaabaBadge}>
                      <View style={styles.kaabaIcon}>
                        <View style={styles.kaabaBand} />
                      </View>
                    </View>
                    <View style={styles.qiblaNeedle} />
                  </View>
                </View>
                <View style={styles.centerDisc}>
                  <View style={[styles.centerDot, isAligned && { backgroundColor: colors.accent }]} />
                  <Text style={styles.headingValue}>{compass.available ? `${Math.round(compass.heading)}°` : `${Math.round(qibla)}°`}</Text>
                  <Text style={styles.headingLabel}>{t.qiblaHeadingLabel}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.turnPill, isAligned && styles.turnPillAligned]}>
              <RefreshCw color={isAligned ? colors.accentDark : colors.accent} size={18} />
              <Text style={[styles.turnText, isAligned && { color: colors.accentDark }]}>
                {!compass.available
                  ? t.qiblaNoCompass.replace('{deg}', String(Math.round(qibla)))
                  : isAligned
                    ? t.qiblaAligned
                    : delta! > 0
                      ? t.qiblaTurnRight.replace('{n}', String(Math.round(delta!)))
                      : t.qiblaTurnLeft.replace('{n}', String(Math.round(-delta!)))}
              </Text>
            </View>
            {compass.available && !isAligned ? <Text style={[type.small, { textAlign: 'center', marginTop: 8 }]}>{t.qiblaAlignHint}</Text> : null}
            {compass.lowAccuracy ? <Text style={styles.warning}>{t.qiblaLowAccuracy}</Text> : null}

            <Card style={styles.infoCard}>
              <InfoRow icon={<Navigation color={colors.textMuted} size={18} />} label={t.qiblaDirection} value={`${Math.round(qibla)}° ${t.qiblaFromNorth}`} highlight />
              <InfoRow icon={<Ruler color={colors.textMuted} size={18} />} label={t.qiblaDistance} value={`${distanceKm(location.lat!, location.lon!).toLocaleString('ru-RU')} ${t.qiblaKm}`} />
              <InfoRow icon={<MapPin color={colors.textMuted} size={18} />} label={t.qiblaYourLocation} value={`${location.lat!.toFixed(3)}, ${location.lon!.toFixed(3)}`} />
              {compass.declination !== null ? (
                <InfoRow
                  icon={<SlidersHorizontal color={colors.textMuted} size={18} />}
                  label={t.qiblaDeclination}
                  value={`${compass.declination >= 0 ? '+' : ''}${compass.declination.toFixed(1)}°`}
                />
              ) : null}
            </Card>

            <Card style={styles.calibrateCard}>
              <View style={styles.calibrateIcon}>
                <InfinityIcon color={colors.accent} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.title}>{t.qiblaCalibrateTitle}</Text>
                <Text style={[type.muted, { marginTop: 4 }]}>{t.qiblaCalibrate}</Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: colors.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  deniedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  deniedText: { textAlign: 'center', paddingHorizontal: 20 },
  locationChip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  locationChipText: { color: colors.accent, fontSize: 12, fontFamily: fonts.semibold },
  compassWrap: { alignItems: 'center', marginTop: 20 },
  pointerStem: { width: 4, height: 12, borderRadius: 2, backgroundColor: colors.text, marginTop: 2, marginBottom: 6 },
  dial: { width: DIAL, height: DIAL, borderRadius: DIAL / 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dialAligned: { borderColor: colors.accent, borderWidth: 2 },
  dialRotor: { position: 'absolute', width: DIAL, height: DIAL },
  tickWrap: { position: 'absolute', width: DIAL, height: DIAL, alignItems: 'center', paddingTop: 6 },
  tick: { width: 1, height: 6, backgroundColor: '#2C4A68' },
  tickMajor: { width: 2, height: 10, backgroundColor: '#4E6A85' },
  tickCardinal: { width: 2, height: 14, backgroundColor: colors.textMuted },
  cardinalWrap: { position: 'absolute', width: DIAL, height: DIAL, alignItems: 'center', paddingTop: 24 },
  cardinal: { color: colors.textMuted, fontSize: 16, fontFamily: fonts.bold },
  cardinalNorth: { color: colors.heart },
  qiblaNeedleWrap: { position: 'absolute', width: DIAL, height: DIAL, alignItems: 'center', paddingTop: 50 },
  kaabaBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  kaabaIcon: { width: 20, height: 20, backgroundColor: '#111', borderRadius: 2, borderWidth: 1, borderColor: '#D4AF37' },
  kaabaBand: { height: 3, marginTop: 5, backgroundColor: '#D4AF37' },
  qiblaNeedle: { width: 3, height: DIAL / 2 - 140, minHeight: 20, backgroundColor: colors.accent, borderRadius: 2, opacity: 0.8 },
  centerDisc: { width: 124, height: 124, borderRadius: 62, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  centerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.textMuted, marginBottom: 6 },
  headingValue: { color: colors.text, fontSize: 26, fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  headingLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, fontFamily: fonts.semibold },
  turnPill: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.cardAlt, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, marginTop: 24, maxWidth: '100%' },
  turnPillAligned: { backgroundColor: colors.accent },
  turnText: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold, flexShrink: 1, textAlign: 'center' },
  warning: { color: colors.warnText, fontSize: 12, textAlign: 'center', marginTop: 8, fontFamily: fonts.regular },
  infoCard: { marginTop: 22, paddingVertical: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  infoLabel: { flex: 1, color: colors.text, fontSize: 15, fontFamily: fonts.regular },
  infoValue: { color: colors.text, fontSize: 15, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  calibrateCard: { marginTop: 16, flexDirection: 'row', gap: 14 },
  calibrateIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
});

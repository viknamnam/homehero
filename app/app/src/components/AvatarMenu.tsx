import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { copy } from '../copy/strings';
import { Icon, IconName } from './icons';
import { IconBadge } from './ui';
import { colors, radius, shadow, spacing, type } from '../theme/tokens';

// Avatar menu (founder bug report): the old Alert had FOUR buttons — Android
// renders at most three, so Cancel never appeared and the dialog couldn't be
// dismissed. This sheet replaces it: clear options, a ✕, and backdrop-tap to
// close. Photo options only render when cloud photo upload is available.
export function AvatarMenuSheet({ visible, onClose, onHeroFace, onCamera, onLibrary, photosAvailable }: {
  visible: boolean;
  onClose: () => void;
  onHeroFace: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  photosAvailable: boolean;
}) {
  const Row = ({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <IconBadge icon={icon} tint={colors.sageTint} size={36} />
      <Text style={[type.body, { marginLeft: spacing.m }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.photo.cancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[type.h2, { flex: 1 }]}>{copy.photo.menuTitle}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={copy.photo.cancel} style={styles.closeBtn}>
              <Icon name="x" size={18} color={colors.charcoalSoft} />
            </Pressable>
          </View>
          <Row icon="sparkles" label={copy.photo.heroOption} onPress={onHeroFace} />
          {photosAvailable && <Row icon="camera" label={copy.photo.camera} onPress={onCamera} />}
          {photosAvailable && <Row icon="bag" label={copy.photo.library} onPress={onLibrary} />}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46, 53, 72, 0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.warmWhite,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: spacing.xl, paddingHorizontal: spacing.l, paddingBottom: spacing.xl,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.l, minHeight: 48 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadow.card,
  },
});

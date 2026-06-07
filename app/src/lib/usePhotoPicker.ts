import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { copy } from '../copy/strings';
import { FLAGS } from '../constants/flags';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from './sync';

// ONE avatar flow for the whole app: tap -> camera / library / hero face.
// - Photos need cloud (household-scoped storage upload via sync.uploadAvatar).
// - Hero faces work fully OFFLINE (no upload — just `avatar://<key>` in state),
//   and sync to the household when a cloud session exists.
// Screens using this hook must render <HeroAvatarPicker> with the returned
// visibility/handlers (see TodayScreen / SettingsScreen).
export function usePhotoPicker() {
  const sync = useSync();
  const { state } = useHousehold();
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);

  const canUploadPhoto = !!state.cloud.householdId && !!sync.session;
  const canPickHero = FLAGS.heroAvatars && !!state.meId;
  const canEditPhoto = canUploadPhoto || canPickHero; // keeps existing call-sites' prop name

  const upload = async (uri?: string) => { if (uri) await sync.uploadAvatar(uri); };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!r.canceled) await upload(r.assets?.[0]?.uri);
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!r.canceled) await upload(r.assets?.[0]?.uri);
  };

  const changeMyPhoto = () => {
    if (!canEditPhoto) return;
    // Web: Alert option lists don't render — go straight to the best available path
    if (Platform.OS === 'web') {
      if (canUploadPhoto) { void fromLibrary(); } else { setAvatarPickerVisible(true); }
      return;
    }
    // No cloud yet: hero faces are the only option — skip the chooser
    if (!canUploadPhoto) { setAvatarPickerVisible(true); return; }
    Alert.alert(copy.photo.title, undefined, [
      { text: copy.photo.camera, onPress: () => void fromCamera() },
      { text: copy.photo.library, onPress: () => void fromLibrary() },
      ...(canPickHero ? [{ text: copy.photo.heroOption, onPress: () => setAvatarPickerVisible(true) }] : []),
      { text: copy.photo.cancel, style: 'cancel' as const },
    ]);
  };

  const pickHeroAvatar = (key: string) => {
    setAvatarPickerVisible(false);
    void sync.setHeroAvatar(key);
  };

  return {
    canEditPhoto,
    changeMyPhoto,
    avatarPickerVisible,
    closeAvatarPicker: () => setAvatarPickerVisible(false),
    pickHeroAvatar,
  };
}

import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { copy } from '../copy/strings';
import { useHousehold } from '../store/HouseholdStore';
import { useSync } from './sync';

// ONE photo flow for every avatar in the app: tap -> camera or library -> square
// crop -> household-scoped upload (sync.uploadAvatar). Web skips the chooser
// (browsers route camera through the file dialog anyway).
export function usePhotoPicker() {
  const sync = useSync();
  const { state } = useHousehold();
  const canEditPhoto = !!state.cloud.householdId && !!sync.session;

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
    if (Platform.OS === 'web') { void fromLibrary(); return; }
    Alert.alert(copy.photo.title, undefined, [
      { text: copy.photo.camera, onPress: () => void fromCamera() },
      { text: copy.photo.library, onPress: () => void fromLibrary() },
      { text: copy.photo.cancel, style: 'cancel' },
    ]);
  };

  return { canEditPhoto, changeMyPhoto };
}

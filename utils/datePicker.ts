import { Platform } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export function openNativeDatePicker(options: {
  value: Date;
  minimumDate?: Date;
  onPick: (date: Date) => void;
  onFallback?: () => void;
}) {
  if (Platform.OS === 'android') {
    DateTimePickerAndroid.open({
      value: options.value,
      mode: 'date',
      minimumDate: options.minimumDate,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) return;
        options.onPick(selectedDate);
      },
    });
    return;
  }

  options.onFallback?.();
}

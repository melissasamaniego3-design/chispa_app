import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../lib/levels';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
  testID?: string;
};

export default function Card({ children, style, color, testID }: Props) {
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: color ?? COLORS.surface, borderBottomColor: COLORS.borderStrong },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderBottomWidth: 5,
    padding: 18,
  },
});

export { Text as CardText };

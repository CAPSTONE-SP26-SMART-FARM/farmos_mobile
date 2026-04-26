import React from 'react'
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native'

interface CardProps {
  title: string
  children: React.ReactNode
  contentStyle?: StyleProp<ViewStyle>
}

export const Card = ({ title, children, contentStyle }: CardProps) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={[styles.sectionContent, contentStyle]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1F2937'
  },
  sectionContent: {
    padding: 16,
    gap: 12
  }
})

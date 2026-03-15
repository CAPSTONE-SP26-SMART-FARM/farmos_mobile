import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

export const CollapsibleSection = ({
  title,
  children,
  defaultExpanded = true
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <View style={styles.section}>
      <Pressable
        style={[styles.sectionHeader, !isExpanded && styles.sectionHeaderCollapsed]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color='#4B5563'
        />
      </Pressable>
      <View style={[styles.sectionContent, !isExpanded && styles.sectionContentCollapsed]}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14
  },
  sectionHeaderCollapsed: { paddingBottom: 14 },
  sectionTitle: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: '#1F2937' },
  sectionContent: { padding: 16, gap: 12 },
  sectionContentCollapsed: { height: 0, padding: 0, overflow: 'hidden' }
})

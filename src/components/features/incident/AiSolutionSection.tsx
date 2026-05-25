import { View, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'
import type { TicketSolution } from '@/services/api/ticketLifecycle'

interface AiSolutionSectionProps {
  solution: TicketSolution
}

/**
 * Render structured AI-generated solution returned by Gemini when a ticket
 * is auto-resolved via the AI fallback flow.
 *
 * Visible to owner/farmer when ticket.isAIResolved = true.
 */
export function AiSolutionSection({ solution }: AiSolutionSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name='auto-awesome' size={18} color='#7C3AED' />
        <Text style={styles.headerTitle}>Giải pháp AI</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>

      <Field label='Nguyên nhân gốc rễ' value={solution.rootCause} />
      <Field label='Lý do' value={solution.rootCauseReason} />
      <Field label='Cách xử lý' value={solution.treatment} />
      <Field label='Cách phòng ngừa' value={solution.prevention} />
    </View>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  aiBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#7C3AED',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
    fontFamily: 'Inter_400Regular',
  },
})

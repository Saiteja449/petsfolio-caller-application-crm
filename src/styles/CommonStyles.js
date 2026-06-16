import { StyleSheet } from 'react-native';
import { Colors } from './Colors';
import { Fonts } from './Fonts';
import { Spacing } from './Spacing';
import { Shadows } from './Shadows';
import Theme from './Theme';

export const CommonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  screenHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  textSubtitle: {
    fontSize: Fonts.sizes.md,
    fontFamily: Fonts.family.semiBold,
    color: Colors.text,
  },
  textBody: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
  },
  textCaption: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  textMuted: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  sectionHeader: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.family.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Theme.borderRadiusFull,
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.family.semiBold,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    color: Colors.success,
  },
  badgeDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    color: Colors.danger,
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: Colors.warning,
  },
  badgePrimary: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    color: Colors.primary,
  },
  searchBar: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  chartPlaceholder: {
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLg: {
    width: 80,
    height: 80,
    borderRadius: Theme.borderRadiusFull,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    fontFamily: Fonts.family.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.family.semiBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Theme.borderRadiusSm,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadius,
    padding: Spacing.lg,
    ...Shadows.card,
    minWidth: 140,
  },
  statValue: {
    fontSize: Fonts.sizes.xxl,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  dialPad: {
    backgroundColor: Colors.card,
    borderRadius: Theme.borderRadiusLg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  dialKey: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.dialPadKey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialKeyText: {
    fontSize: Fonts.sizes.xxl,
    color: Colors.dialPadKeyText,
    fontFamily: Fonts.family.regular,
  },
  dialSubText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dialDisplay: {
    fontSize: Fonts.sizes.xxxl,
    fontFamily: Fonts.family.regular,
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    minHeight: 60,
  },
  callButton: {
    width: 64,
    height: 64,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.callGreen,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadiusFull,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.family.bold,
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47%',
  },
  marginBottomSm: {
    marginBottom: Spacing.sm,
  },
  marginBottomMd: {
    marginBottom: Spacing.md,
  },
  marginBottomLg: {
    marginBottom: Spacing.lg,
  },
  gapSm: {
    gap: Spacing.sm,
  },
  gapMd: {
    gap: Spacing.md,
  },
});

export default CommonStyles;

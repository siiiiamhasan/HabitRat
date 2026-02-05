import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import UniversalModal from './UniversalModal';
import { X, Check, Crown, Zap, BarChart3, Bell, Infinity, History } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';

const { width } = Dimensions.get('window');

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function PremiumModal({ visible, onClose }: PremiumModalProps) {
    const { setPremium } = useHabitStore();

    const handlePurchase = (plan: string) => {
        // Mock purchase flow
        setPremium(true);
        onClose();
        // meaningful feedback would happen here in a real app
    };

    const FeatureRow = ({ icon: Icon, text }: { icon: any, text: string }) => (
        <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
                <Icon size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    const PricingCard = ({
        title,
        price,
        period,
        badge,
        recommended,
        onPress
    }: {
        title: string,
        price: string,
        period: string,
        badge?: string,
        recommended?: boolean,
        onPress: () => void
    }) => (
        <TouchableOpacity
            style={[
                styles.pricingCard,
                recommended && styles.pricingCardRecommended
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {badge && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Text style={[styles.planTitle, recommended && styles.textRecommended]}>{title}</Text>
            <View style={styles.priceContainer}>
                <Text style={[styles.priceValue, recommended && styles.textRecommended]}>{price}</Text>
                <Text style={[styles.pricePeriod, recommended && { color: 'rgba(255,255,255,0.8)' }]}>{period}</Text>
            </View>
            {recommended && <Check size={20} color="white" style={{ position: 'absolute', top: 16, right: 16 }} />}
        </TouchableOpacity>
    );

    return (
        <UniversalModal visible={visible} onClose={onClose} animationType="slide">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View style={styles.crownCircle}>
                            <Crown size={32} color="#F59E0B" fill="#F59E0B" />
                        </View>
                        <Text style={styles.title}>Unlock HabitRat Premium</Text>
                        <Text style={styles.subtitle}>Supercharge your habits with advanced tools</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                    {/* Features List */}
                    <View style={styles.featuresContainer}>
                        <FeatureRow icon={BarChart3} text="Advanced Analytics & Insights" />
                        <FeatureRow icon={Bell} text="Unlimited Custom Reminders" />
                        <FeatureRow icon={Infinity} text="Track Unlimited Habits" />
                        <FeatureRow icon={History} text="Retroactive Habit Completion" />
                        <FeatureRow icon={Zap} text="Data Backup & No Ads" />
                    </View>

                    {/* Pricing Tier 1: Yearly (Recommended) */}
                    <PricingCard
                        title="Yearly"
                        price="$39.99"
                        period="/ year"
                        badge="MOST POPULAR - SAVE 33%"
                        recommended
                        onPress={() => handlePurchase('yearly')}
                    />

                    <View style={styles.rowCards}>
                        {/* Pricing Tier 2: Monthly */}
                        <PricingCard
                            title="Monthly"
                            price="$4.99"
                            period="/ month"
                            onPress={() => handlePurchase('monthly')}
                        />

                        {/* Pricing Tier 3: Lifetime */}
                        <PricingCard
                            title="Lifetime"
                            price="$99.99"
                            period="once"
                            badge="BEST VALUE"
                            onPress={() => handlePurchase('lifetime')}
                        />
                    </View>

                    <Text style={styles.disclaimer}>
                        Recurring billing. Cancel anytime.
                    </Text>

                </ScrollView>

                {/* Sticky Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => handlePurchase('yearly')}
                    >
                        <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </UniversalModal>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '95%',
        height: '92%',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        overflow: 'hidden', // Ensures footer respects border radius
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 16,
    },
    crownCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#FFFBEB',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    content: {
        padding: 24,
        paddingBottom: 120,
    },
    featuresContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 32,
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    featureIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    // Pricing
    pricingCard: {
        flex: 1,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        position: 'relative',
        minHeight: 140,
        justifyContent: 'center',
    },
    pricingCardRecommended: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        marginBottom: 20,
        width: '100%',
    },
    rowCards: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    planTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    priceContainer: {
        alignItems: 'center',
    },
    priceValue: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.text,
    },
    pricePeriod: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    textRecommended: {
        color: 'white',
    },
    badgeContainer: {
        position: 'absolute',
        top: -12,
        backgroundColor: '#F59E0B',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    disclaimer: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    ctaButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    ctaText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

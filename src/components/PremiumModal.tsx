import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal } from 'react-native';
import { useHabitStore } from '../store/useHabitStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Star, Zap, Infinity, Crown, Trophy, Sparkles, Coins } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

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
    };

    const FeatureItem = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
        <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
                <Icon size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );

    const PricingCard = ({
        title,
        price,
        period,
        badge,
        selected,
        onPress
    }: {
        title: string,
        price: string,
        period: string,
        badge?: string,
        selected?: boolean,
        onPress: () => void
    }) => (
        <TouchableOpacity
            style={[
                styles.pricingCard,
                selected && styles.pricingCardSelected
            ]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {selected && (
                <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
            )}

            {badge && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}

            <View style={{ zIndex: 1 }}>
                <Text style={[styles.planTitle, selected && styles.textWhite]}>{title}</Text>
                <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, selected && styles.textWhite]}>{price}</Text>
                </View>
                <Text style={[styles.pricePeriod, selected && styles.textWhiteOpacity]}>{period}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Hero Section */}
                    <View style={styles.heroContainer}>
                        <LinearGradient
                            colors={['#4C1D95', '#8B5CF6']}
                            style={styles.heroBackground}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>

                        <View style={styles.heroContent}>
                            <View style={styles.iconRing}>
                                <Crown size={48} color="#F59E0B" fill="#F59E0B" />
                            </View>
                            <Text style={styles.heroTitle}>Unlock Everything</Text>
                            <Text style={styles.heroSubtitle}>Become a HabitRat Pro</Text>
                        </View>

                        {/* Decorative Circles */}
                        <View style={[styles.circle, { top: -50, right: -50, width: 200, height: 200, opacity: 0.1 }]} />
                        <View style={[styles.circle, { bottom: -30, left: -30, width: 120, height: 120, opacity: 0.1 }]} />
                    </View>

                    <View style={styles.contentContainer}>
                        {/* Features */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>PREMIUM FEATURES</Text>
                            <View style={styles.featuresGrid}>
                                <FeatureItem
                                    icon={Trophy}
                                    title="Advanced Analytics"
                                    subtitle="Deep dive into your habits"
                                />
                                <FeatureItem
                                    icon={Coins}
                                    title="200 Coins Monthly"
                                    subtitle="Get 200 extra coins every month"
                                />
                                <FeatureItem
                                    icon={Infinity}
                                    title="Unlimited Habits"
                                    subtitle="Track as many as you want"
                                />
                                <FeatureItem
                                    icon={Star}
                                    title="Custom Notifications"
                                    subtitle="Never miss a habit again"
                                />

                                <FeatureItem
                                    icon={Zap}
                                    title="Ad-free Experience"
                                    subtitle="Focus on your habits, zero ads"
                                />
                            </View>
                        </View>

                        {/* Pricing */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>CHOOSE YOUR PLAN</Text>

                            {/* Plans Grid */}
                            <View style={styles.plansContainer}>
                                <PricingCard
                                    title="Monthly"
                                    price="$1.00"
                                    period="per month"
                                    onPress={() => handlePurchase('monthly')}
                                />
                                <PricingCard
                                    title="Yearly"
                                    price="$5.99"
                                    period="per year"
                                    badge="MOST POPULAR"
                                    selected
                                    onPress={() => handlePurchase('yearly')}
                                />
                                <PricingCard
                                    title="Lifetime"
                                    price="$20.00"
                                    period="one-time payment"
                                    onPress={() => handlePurchase('lifetime')}
                                />
                            </View>
                        </View>

                        <Text style={styles.disclaimer}>
                            Recurring billing, cancel anytime. Restore purchases in settings.
                        </Text>
                    </View>
                </ScrollView>

                {/* Sticky CTA */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => handlePurchase('yearly')}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
                            <Text style={styles.ctaSubtext}>Then $5.99/year</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    heroContainer: {
        height: 300,
        backgroundColor: '#8B5CF6',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    heroBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 20,
    },
    heroContent: {
        alignItems: 'center',
        zIndex: 1,
    },
    iconRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'white',
    },
    contentContainer: {
        padding: 24,
        paddingTop: 32,
        paddingBottom: 120, // Space for footer
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 16,
        letterSpacing: 1.5,
        textAlign: 'center',
    },
    featuresGrid: {
        gap: 16,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    featureIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    featureSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    plansContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    pricingCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pricingCardSelected: {
        transform: [{ scale: 1.05 }],
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden', // Contain gradient
    },
    badgeContainer: {
        position: 'absolute',
        top: 0,
        backgroundColor: '#F59E0B',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        zIndex: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    planTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        textAlign: 'center',
    },
    priceContainer: {
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    pricePeriod: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    textWhite: {
        color: 'white',
    },
    textWhiteOpacity: {
        color: 'rgba(255,255,255,0.8)',
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 24,
        paddingTop: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    ctaButton: {
        width: '100%',
        borderRadius: 16,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    ctaGradient: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    ctaText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    ctaSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { Settings, Share2, X, ChevronRight, LogOut, User, Shield, Moon, Bell, Edit3, Send, Crown, Check, Flame, Trophy, Calendar, Star, QrCode, PlayCircle, BarChart3, Globe, Database, MessageCircle, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnalyticsModal from '../components/AnalyticsModal';
import { useHabitStore } from '../store/useHabitStore';
import Heatmap from '../components/Heatmap';
import YearlyHeatmap from '../components/YearlyHeatmap';
import NotificationManager from '../components/NotificationManager';
import { useTranslation, LANGUAGES, Language } from '../utils/i18n';
import PremiumModal from '../components/PremiumModal';
import ShareCardModal from '../components/ShareCardModal';
import UniversalModal from '../components/UniversalModal';
import RateAppModal from '../components/RateAppModal';

export default function ProfileScreen() {
    const { updateUser, getCurrentStreak, isPremium, setPremium, populateDummyData, watchAd, adsWatchedToday, setLanguage } = useHabitStore();
    const user = useHabitStore((state) => state.user);
    const getMonthlySuccessRate = useHabitStore((state) => state.getMonthlySuccessRate);
    const getYearlyTotalCompletions = useHabitStore((state) => state.getYearlyTotalCompletions);
    const getYearlySuccessRate = useHabitStore((state) => state.getYearlySuccessRate);
    const getBestStreak = useHabitStore((state) => state.getBestStreak);

    const [shareMode, setShareMode] = useState<'monthly' | 'yearly'>('monthly');

    // Stats for Share Card
    const monthlySuccess = getMonthlySuccessRate(new Date());
    const yearlyTotal = getYearlyTotalCompletions(new Date().getFullYear());
    const yearSuccessRate = getYearlySuccessRate(new Date().getFullYear());
    const bestStreak = getBestStreak();


    const { t, language } = useTranslation();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();



    // Modals state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [editType, setEditType] = useState<'name' | 'username' | 'avatar'>('name');
    const [editValue, setEditValue] = useState('');
    const [analyticsVisible, setAnalyticsVisible] = useState(false);
    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const [premiumModalVisible, setPremiumModalVisible] = useState(false);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);
    const [rateModalVisible, setRateModalVisible] = useState(false);

    const [shareModalVisible, setShareModalVisible] = useState(false);

    const openEditModal = (type: 'name' | 'username' | 'avatar', value: string) => {
        setSettingsModalVisible(false); // Close settings menu first
        setEditType(type);
        setEditValue(value);
        // Small timeout to allow exit animation if needed, but react state batching usually handles it
        setTimeout(() => setEditModalVisible(true), 100);
    };

    const handleSaveEdit = () => {
        if (editValue.trim()) {
            updateUser({ [editType]: editValue });
            setEditModalVisible(false);
        }
    };

    const handleSettingsPress = () => {
        setSettingsModalVisible(true);
    };

    const handleShareProgress = async () => {
        try {
            const streak = getCurrentStreak();
            await Share.share({
                message: `🔥 I'm on a ${streak} day streak in Habit Tracker! Check out my progress!`,
            });
        } catch (error: any) {
            console.log(error.message);
        }
    };

    const handleOpenAnalytics = () => {
        if (isPremium) {
            setAnalyticsVisible(true);
        } else {
            setPremiumModalVisible(true);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* New Social Style Header */}
                <View style={styles.headerContainer}>
                    {/* Top Bar: Name + Actions */}
                    <View style={styles.topBar}>
                        <Text style={styles.headerName}>{user.name}</Text>
                        {/* Actions moved below username */}
                    </View>

                    {/* Profile Info Row */}
                    <View style={styles.profileRow}>
                        <Image source={{ uri: user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }} style={styles.mainAvatar} />
                        {/* Stats could be here if we had local stats like 'Total Habits' */}
                    </View>

                    {/* User Username */}
                    <Text style={[styles.headerUsername, { marginBottom: 16 }]}>{user.username}</Text>

                    {/* Action Buttons Row */}
                    <View style={styles.profileActionsRow}>
                        <TouchableOpacity onPress={() => setShareModalVisible(true)} style={[styles.profileActionButton, { marginRight: 12, backgroundColor: '#E0F2FE' }]}>
                            <Send size={16} color={theme.colors.primary} />
                            <Text style={[styles.profileActionText, { color: theme.colors.primary }]}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSettingsPress} style={[styles.profileActionButton, { backgroundColor: '#F3F4F6' }]}>
                            <Edit3 size={16} color={theme.colors.text} />
                            <Text style={styles.profileActionText}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />
                </View>

                {/* Earn Diamonds (Non-Premium) */}
                {!isPremium && (
                    <View style={styles.card}>
                        <View style={{ padding: 16 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text style={styles.sectionHeader}>{t('section.earn')}</Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{adsWatchedToday}/5 today</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.adButton, adsWatchedToday >= 5 && styles.adButtonDisabled]}
                                onPress={async () => {
                                    if (adsWatchedToday >= 5) return;
                                    Alert.alert("Watch Ad", "Watching ad...", [], { cancelable: false });
                                    const success = await watchAd();
                                    if (success) {
                                        Alert.alert("Reward", "You earned 4 Diamonds! 💎", [{ text: "OK" }], { cancelable: true });
                                    } else {
                                        Alert.alert("Limit Reached", "You have reached your daily limit.", [{ text: "OK" }], { cancelable: true });
                                    }
                                }}
                                disabled={adsWatchedToday >= 5}
                            >
                                <PlayCircle size={20} color={adsWatchedToday >= 5 ? "#A0AEC0" : "white"} />
                                <Text style={[styles.adButtonText, adsWatchedToday >= 5 && { color: "#A0AEC0" }]}>
                                    {adsWatchedToday >= 5 ? "Daily Limit Reached" : `${t('btn.watch_ad')} (+4 💎)`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                {!isPremium && (
                    <TouchableOpacity onPress={() => setPremiumModalVisible(true)}>
                        <LinearGradient
                            colors={['#8B5CF6', '#EC4899']} // Violet to Pink gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.proBanner}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={styles.proIconBox}>
                                    <Crown size={20} color="#8B5CF6" fill="#8B5CF6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.proTitle}>Become a HabitRat Pro</Text>
                                    <Text style={styles.proSubtitle}>Unlocks all premium features</Text>
                                </View>
                                <ChevronRight size={20} color="white" />
                            </View>
                            {/* Decorative elements */}
                            <View style={styles.proDecoration1} />
                            <View style={styles.proDecoration2} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Account Section */}
                <Text style={styles.sectionHeader}>{t('section.account')}</Text>
                <View style={styles.card}>
                    <SettingsItem
                        icon={Bell}
                        label={t('menu.notifications')}
                        onPress={() => setNotificationsVisible(true)}
                    />
                    <SettingsItem
                        icon={BarChart3}
                        label="Advanced Analytics"
                        onPress={handleOpenAnalytics}
                        value={!isPremium ? 'Premium' : ''}
                    />
                    <SettingsItem
                        icon={Globe}
                        label={t('menu.language')}
                        value={LANGUAGES.find(l => l.code === language)?.label}
                        onPress={() => setLanguageModalVisible(true)}
                    />
                    <MenuItem icon={Database} label={t('menu.seed_data')} last onPress={() => {
                        populateDummyData();
                        Alert.alert("Success", "Dummy data populated for past 14 days!", [{ text: "OK" }], { cancelable: true });
                    }} />
                    <MenuItem icon={Crown} label="Reset to Free (Dev)" onPress={() => {
                        setPremium(false);
                        Alert.alert("Success", "You are now a Free user.", [{ text: "OK" }], { cancelable: true });
                    }} />
                    <SettingsItem
                        icon={Database}
                        label="Terms of Service"
                        onPress={() => (navigation as any).navigate('Terms')}
                    />
                    <SettingsItem
                        icon={Database}
                        label="Privacy Policy"
                        onPress={() => (navigation as any).navigate('Privacy')}
                        last
                    />
                </View>

                {/* Social Section */}
                <Text style={styles.sectionHeader}>{t('section.social')}</Text>
                <View style={styles.card}>
                    <SettingsItem icon={Share2} label={t('menu.share')} onPress={() => setShareModalVisible(true)} />
                    <SettingsItem icon={Star} label={t('menu.rate')} onPress={() => setRateModalVisible(true)} />
                    <SettingsItem icon={MessageCircle} label={t('menu.feedback')} last />
                </View>

                {/* Statistics Section */}
                <View style={styles.card}>
                    <View style={{ padding: 16, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.statsTitle}>{t('section.stats')}</Text>
                        <TouchableOpacity onPress={handleOpenAnalytics}>
                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>View Analytics</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{useHabitStore.getState().getTotalCompletions()}</Text>
                            <Text style={styles.statLabel}>{t('stats.habits')}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{useHabitStore.getState().getOverallSuccessRate()}%</Text>
                            <Text style={styles.statLabel}>{t('stats.success')}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{useHabitStore.getState().getBestStreak()}</Text>
                            <Text style={styles.statLabel}>{t('stats.streak')}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Modals */}
            <AnalyticsModal visible={analyticsVisible} onClose={() => setAnalyticsVisible(false)} />
            <NotificationManager visible={notificationsVisible} onClose={() => setNotificationsVisible(false)} />
            <PremiumModal visible={premiumModalVisible} onClose={() => setPremiumModalVisible(false)} />
            <RateAppModal visible={rateModalVisible} onClose={() => setRateModalVisible(false)} />

            {/* Revised Edit Modal */}
            <UniversalModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} animationType="slide">
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalIconBox}>
                            {editType === 'name' ? <Settings size={24} color={theme.colors.primary} /> :
                                editType === 'username' ? <Users size={24} color={theme.colors.primary} /> :
                                    <Image source={{ uri: user.avatar }} style={{ width: 24, height: 24, borderRadius: 12 }} />}
                        </View>
                        <Text style={styles.modalTitle}>
                            {editType === 'name' ? 'Update Name' : editType === 'username' ? 'Update Username' : 'Change Avatar'}
                        </Text>
                    </View>

                    <Text style={styles.inputLabel}>
                        {editType === 'name' ? 'Enter your full name' :
                            editType === 'username' ? 'Choose a unique username' :
                                'Enter image URL'}
                    </Text>

                    <TextInput
                        style={styles.enhancedInput}
                        value={editValue}
                        onChangeText={setEditValue}
                        autoFocus
                        placeholder={editType === 'avatar' ? 'https://example.com/avatar.jpg' : 'Type here...'}
                        placeholderTextColor={theme.colors.textSecondary}
                    />

                    <View style={styles.modalButtonsColumn}>
                        <TouchableOpacity onPress={handleSaveEdit} style={styles.saveButtonFull}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.cancelButtonFull}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </UniversalModal>

            {/* Settings Menu Modal (Action Sheet Style) */}
            <UniversalModal visible={settingsModalVisible} onClose={() => setSettingsModalVisible(false)} animationType="slide" presentationStyle="overFullScreen">
                <View style={[styles.modalContent, { marginTop: 'auto', marginBottom: 20, width: '95%' }]}>
                    <Text style={styles.actionSheetTitle}>Profile Settings</Text>

                    <TouchableOpacity style={styles.actionSheetItem} onPress={() => openEditModal('name', user.name)}>
                        <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                            <Settings size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.actionSheetText}>Edit Name</Text>
                        <ChevronRight size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionSheetItem} onPress={() => openEditModal('username', user.username)}>
                        <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                            <Users size={20} color="#10B981" />
                        </View>
                        <Text style={styles.actionSheetText}>Edit Username</Text>
                        <ChevronRight size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>





                    <TouchableOpacity style={[styles.actionSheetCancel]} onPress={() => setSettingsModalVisible(false)}>
                        <Text style={styles.actionSheetCancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </UniversalModal>

            {/* Share Progress Modal */}
            <ShareCardModal
                visible={shareModalVisible}
                onClose={() => setShareModalVisible(false)}
                mode="monthly"
            />
            {/* Language Modal */}
            <UniversalModal visible={languageModalVisible} onClose={() => setLanguageModalVisible(false)} animationType="fade">
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{t('modal.lang_title')}</Text>
                    {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.languageOption,
                                language === lang.code && styles.languageOptionSelected
                            ]}
                            onPress={() => {
                                setLanguage(lang.code);
                                setLanguageModalVisible(false);
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                                <Text style={styles.languageText}>{lang.label}</Text>
                            </View>
                            {language === lang.code && <Check size={20} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.cancelButton, { alignSelf: 'center', marginTop: 10 }]}
                        onPress={() => setLanguageModalVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </UniversalModal>
        </View>
    );
}


function MenuItem({ icon: Icon, label, last, onPress, value }: { icon: any, label: string, last?: boolean, onPress?: () => void, value?: string }) {
    return (
        <TouchableOpacity style={[styles.menuItem, last && { borderBottomWidth: 0 }]} onPress={onPress}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.iconBox}>
                    <Icon size={18} color="white" />
                </View>
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {value && <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{value}</Text>}
                <ChevronRight size={16} color={theme.colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
}

// Helper for SettingsItem
const SettingsItem = MenuItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Pure white background
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: theme.spacing.m, // Reduced from l
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E1E4E8',
        marginHorizontal: theme.spacing.m,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12, // Reduced from 16
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    username: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    settingsButton: {
        padding: 8,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4 + theme.spacing.m,
        marginTop: 8,
        textTransform: 'uppercase',
    },
    // New Profile Styles
    headerContainer: {
        paddingHorizontal: theme.spacing.m,
        backgroundColor: 'white',
        paddingBottom: 10, // Reduced from 20
        marginBottom: 8, // Reduced from 16
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8, // Reduced from 16
    },
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center image
        marginTop: 12,
    },
    mainAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'white', // Optional border
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: 20,
    },
    statColumn: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    statLabelText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    headerUsername: {
        fontSize: 15,
        color: theme.colors.text,
        marginTop: 12,
        marginBottom: 20,
        fontWeight: '500',
        textAlign: 'center', // Center text
    },
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6', // Light gray button
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addFriendText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 24,
        marginHorizontal: -16, // Extend to edges
    },
    // End New Styles
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    iconBox: {
        width: 32,
        height: 32,
        backgroundColor: '#3b82f6', // Generic blue for icons
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text,
    },
    profileActionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    profileActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    profileActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    // Pro Banner
    proBanner: {
        marginHorizontal: theme.spacing.m,
        borderRadius: 16,
        padding: 16,
        marginBottom: theme.spacing.m,
        position: 'relative',
        overflow: 'hidden',
    },
    proIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    proTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    proSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    proDecoration1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    proDecoration2: {
        position: 'absolute',
        bottom: -30,
        left: -10,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        padding: 10,
    },
    cancelButtonText: {
        color: theme.colors.textSecondary,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Share Modal
    shareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    shareTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    shareCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 30,
        overflow: 'hidden', // Ensure decoration stays inside
    },
    qrDecoration: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 60,
        height: 60,
        opacity: 0.5,
        zIndex: 1,
    },
    shareAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    shareName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 20,
    },
    shareStreakLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    shareStreakValue: {
        fontSize: 64,
        fontWeight: '900',
        color: theme.colors.primary,
        lineHeight: 80,
    },
    shareButton: {
        backgroundColor: theme.colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Stats
    statsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    // Ad Button
    adButton: {
        backgroundColor: '#805AD5', // Purple
        borderRadius: 8,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    adButtonDisabled: {
        backgroundColor: '#EDF2F7',
    },
    adButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 8,
        minHeight: 56, // Ensure consistent height
    },
    languageOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F0F9FF',
    },
    languageText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '500',
        includeFontPadding: false, // Better alignment for Android
        textAlignVertical: 'center',
    },
    // Enhanced Modal Styles
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    enhancedInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 24,
    },
    modalButtonsColumn: {
        gap: 12,
        width: '100%',
    },
    saveButtonFull: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelButtonFull: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    // Action Sheet (Settings Menu)
    actionSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    actionSheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    actionSheetText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        marginLeft: 16,
    },
    actionSheetCancel: {
        marginTop: 24,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    actionSheetCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    // QR Code
    qrContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 8,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrCode: {
        width: 70,
        height: 70,
    },
    qrLogo: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 4,
        zIndex: 20,
    },
    // Share Card Styles Removed (Moved to ShareCardModal)
});


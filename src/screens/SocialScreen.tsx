import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import UniversalModal from '../components/UniversalModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Trophy, Plus, Globe, Users, Zap, CheckCircle2, Search } from 'lucide-react-native';
import { theme } from '../constants/theme';
import SocialAnalyticsView from '../components/SocialAnalyticsView';
import { useHabitStore, Challenge } from '../store/useHabitStore';

// Types
interface FeedItem {
    id: string;
    user: string;
    avatar: string;
    action: string;
    habit: string;
    timestamp: string;
    likes: number;
    liked: boolean;
    type: 'progress';
}



export default function SocialScreen() {
    const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'trends'>('feed');
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const { challenges, fetchChallenges, joinChallenge, createChallenge, user } = useHabitStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch on mount
    React.useEffect(() => {
        fetchChallenges();
    }, []);

    // Filter Logic
    const filteredChallenges = challenges.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.communityTag && c.communityTag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newChallengeTitle, setNewChallengeTitle] = useState('');
    const [newChallengeDesc, setNewChallengeDesc] = useState('');
    const [newChallengeType, setNewChallengeType] = useState<'friend' | 'worldwide'>('friend');
    const [newChallengeStart, setNewChallengeStart] = useState(new Date().toISOString().split('T')[0]);
    const [newChallengeEnd, setNewChallengeEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);


    // --- Actions ---

    const handleLike = (id: string) => {
        setFeed(feed.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    likes: item.liked ? item.likes - 1 : item.likes + 1,
                    liked: !item.liked
                };
            }
            return item;
        }));
    };

    const handleJoinChallenge = async (id: string) => {
        await joinChallenge(id);
    };

    const handleCreateChallenge = async () => {
        if (!newChallengeTitle || !newChallengeDesc) {
            Alert.alert('Missing Info', 'Please fill in title and description.', [{ text: "OK" }], { cancelable: true });
            return;
        }

        const success = await createChallenge({
            title: newChallengeTitle,
            description: newChallengeDesc,
            type: newChallengeType,
            start_date: newChallengeStart,
            end_date: newChallengeEnd,
            duration: 'Custom'
        });

        if (success) {
            setModalVisible(false);
            setNewChallengeTitle('');
            setNewChallengeDesc('');
            Alert.alert('Success', 'Challenge created!', [{ text: "OK" }], { cancelable: true });
        } else {
            Alert.alert('Error', 'Failed to create challenge. Please try again.');
        }
    };

    // --- Renderers ---

    const renderFeedItem = ({ item }: { item: FeedItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.headerText}>
                    <Text style={styles.userName}>{item.user}</Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
            </View>
            <Text style={styles.content}>
                {item.action} <Text style={styles.highlight}>{item.habit}</Text>!
            </Text>
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleLike(item.id)}
                >
                    <Heart
                        size={20}
                        color={item.liked ? theme.colors.danger : theme.colors.textSecondary}
                        fill={item.liked ? theme.colors.danger : 'transparent'}
                    />
                    <Text style={[styles.actionText, item.liked && { color: theme.colors.danger }]}>
                        {item.likes}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.actionText}>Comment</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderChallengeItem = ({ item }: { item: Challenge }) => {
        const isEvent = item.type === 'event';
        return (
            <View style={[styles.card, isEvent && styles.eventCard]}>
                <View style={styles.cardHeader}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    <View style={styles.headerText}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.userName, isEvent && { color: 'white' }]}>{item.title}</Text>
                            {item.type === 'worldwide' && <Globe size={14} color={theme.colors.primary} />}
                            {item.type === 'event' && <Zap size={14} color="#FFD700" fill="#FFD700" />}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {item.communityTag && (
                                <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 'bold' }}>{item.communityTag}</Text>
                            )}
                            <Text style={[styles.timestamp, isEvent && { color: 'rgba(255,255,255,0.8)' }]}>
                                • {item.duration}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.content, isEvent && { color: 'white' }]}>{item.description}</Text>

                <View style={[styles.footer, { justifyContent: 'space-between' }]}>
                    <View style={styles.participantTag}>
                        <Users size={14} color={isEvent ? 'white' : theme.colors.textSecondary} />
                        <Text style={[styles.participantText, isEvent && { color: 'white' }]}>{item.participants} joined</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.joinButton,
                            item.joined && styles.joinedButton,
                            isEvent && !item.joined && { backgroundColor: 'white' }
                        ]}
                        onPress={() => handleJoinChallenge(item.id)}
                    >
                        {item.joined ? (
                            <>
                                <CheckCircle2 size={16} color="white" />
                                <Text style={styles.joinedButtonText}>Joined</Text>
                            </>
                        ) : (
                            <Text style={[styles.joinButtonText, isEvent && { color: theme.colors.primary }]}>Accept</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.screenTitle}>Community</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createButton}>
                    <Plus color="white" size={20} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
                    onPress={() => setActiveTab('feed')}
                >
                    <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Feed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
                    onPress={() => setActiveTab('challenges')}
                >
                    <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>Challenges</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'trends' && styles.activeTab]}
                    onPress={() => setActiveTab('trends')}
                >
                    <Text style={[styles.tabText, activeTab === 'trends' && styles.activeTabText]}>Trends</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar for Challenges */}
            {activeTab === 'challenges' && (
                <View style={styles.searchContainer}>
                    <Search size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search communities (e.g. r/fitness)..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            )}

            {/* List */}
            {activeTab === 'feed' ? (
                <FlatList
                    data={feed}
                    renderItem={renderFeedItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            ) : activeTab === 'challenges' ? (
                <FlatList
                    data={filteredChallenges}
                    renderItem={renderChallengeItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 80 }} />} // Spacing for bottom tab
                />
            ) : (
                <SocialAnalyticsView />
            )}

            {/* Create Challenge Modal */}
            <UniversalModal visible={modalVisible} onClose={() => setModalVisible(false)} animationType="slide">
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create Challenge</Text>

                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Early Bird 7 Days"
                        value={newChallengeTitle}
                        onChangeText={setNewChallengeTitle}
                    />

                    <Text style={styles.label}>Description & Goal</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="What's the goal?"
                        multiline
                        value={newChallengeDesc}
                        onChangeText={setNewChallengeDesc}
                    />

                    <Text style={styles.label}>Type</Text>
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeOption, newChallengeType === 'friend' && styles.activeType]}
                            onPress={() => setNewChallengeType('friend')}
                        >
                            <Users size={16} color={newChallengeType === 'friend' ? 'white' : theme.colors.text} />
                            <Text style={[styles.typeText, newChallengeType === 'friend' && styles.activeTypeText]}>Friends</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeOption, newChallengeType === 'worldwide' && styles.activeType]}
                            onPress={() => setNewChallengeType('worldwide')}
                        >
                            <Globe size={16} color={newChallengeType === 'worldwide' ? 'white' : theme.colors.text} />
                            <Text style={[styles.typeText, newChallengeType === 'worldwide' && styles.activeTypeText]}>Worldwide</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCreateChallenge} style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>Create</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </UniversalModal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    screenTitle: {
        ...theme.typography.header,
    },
    createButton: {
        backgroundColor: theme.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.m,
        gap: 16,
    },
    tab: {
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.text,
    },
    tabText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: theme.colors.text,
    },
    list: {
        padding: theme.spacing.m,
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: 16,
        marginBottom: theme.spacing.m,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    eventCard: {
        backgroundColor: '#4C1D95', // Deep Purple for events
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.s,
        backgroundColor: theme.colors.secondary,
    },
    headerText: {
        justifyContent: 'center',
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 15,
        color: theme.colors.text,
    },
    timestamp: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    content: {
        fontSize: 15,
        color: theme.colors.text,
        marginBottom: 12,
        lineHeight: 22,
    },
    highlight: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    // Challenges
    participantTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    participantText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    joinButton: {
        backgroundColor: theme.colors.text,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    joinedButton: {
        backgroundColor: theme.colors.success, // Green
        flexDirection: 'row',
        gap: 4,
    },
    joinButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
    joinedButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
    // Modal
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    activeType: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    typeText: {
        fontWeight: '600',
        color: theme.colors.text,
    },
    activeTypeText: {
        color: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        padding: 14,
        flex: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        padding: 14,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.s,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: theme.colors.text,
    },
});

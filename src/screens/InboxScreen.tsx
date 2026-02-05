import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, Plus, UserPlus, Users } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore, Chat } from '../store/useHabitStore';
import { format } from 'date-fns';
import UniversalModal from '../components/UniversalModal';

export default function InboxScreen() {
    const navigation = useNavigation();
    const { chats, addChat } = useHabitStore();
    const [addModalVisible, setAddModalVisible] = useState(false);

    // Add friend functionality - to be connected to real API
    const handleAddChat = (user: { id: string; name: string; avatar: string }) => {
        addChat(user);
        setAddModalVisible(false);
        // Navigate immediately
        // @ts-ignore
        navigation.navigate('ChatDetail', { chatId: user.id });
    };

    const renderItem = ({ item }: { item: Chat }) => {
        const lastMessage = item.messages[0];
        const time = lastMessage ? format(new Date(lastMessage.timestamp), 'h:mm a') : '';

        return (
            <TouchableOpacity
                style={styles.card}
                // @ts-ignore
                onPress={() => navigation.navigate('ChatDetail', { chatId: item.id })}
            >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.contentContainer}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.time}>{time}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                            {lastMessage ? lastMessage.text : 'Start a conversation!'}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Messages</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
                    <Plus size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {chats.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <MessageCircle size={48} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptyText}>Connect with friends to start chatting and sharing progress!</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => setAddModalVisible(true)}>
                        <UserPlus size={20} color="white" />
                        <Text style={styles.ctaText}>Add Friend</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}

            {/* Add Friend Modal */}
            <UniversalModal visible={addModalVisible} onClose={() => setAddModalVisible(false)} animationType="slide">
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add Friend</Text>
                    <Text style={styles.modalSubtitle}>Suggested People</Text>

                    <View style={styles.emptyModalState}>
                        <Users size={40} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyModalText}>Friend search coming soon!</Text>
                        <Text style={styles.emptyModalSubtext}>Connect with real users to start chatting.</Text>
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={() => setAddModalVisible(false)}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </TouchableOpacity>
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
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.m,
        marginBottom: theme.spacing.m,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    addButton: {
        padding: 8,
        backgroundColor: '#E0F2FE',
        borderRadius: 12,
    },
    list: {
        paddingHorizontal: theme.spacing.m,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
        backgroundColor: '#F1F5F9',
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'center',
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.text,
    },
    time: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    message: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: -40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 32,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    ctaText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 12,
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    closeButton: {
        marginTop: 12,
        padding: 12,
        alignItems: 'center',
    },
    closeText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    emptyModalState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyModalText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 12,
    },
    emptyModalSubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
});

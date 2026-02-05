import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, UserPlus, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';

interface SearchUser {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_following?: boolean;
}



export default function UserSearchScreen() {
    const navigation = useNavigation();
    const { followUser, unfollowUser } = useHabitStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchUser[]>([]);

    const handleSearch = () => {
        // No mock users - search functionality can be connected to real API later
        setResults([]);
    };

    const toggleFollow = async (user: SearchUser) => {
        const isFollowing = user.is_following;
        setResults(prev => prev.map(u => u.id === user.id ? { ...u, is_following: !isFollowing } : u));

        if (isFollowing) {
            await unfollowUser(user.id);
        } else {
            await followUser(user.id);
        }
    };

    const renderItem = ({ item }: { item: SearchUser }) => (
        <View style={styles.userRow}>
            <Image
                source={{ uri: item.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.name}>{item.full_name || 'Unknown'}</Text>
                <Text style={styles.username}>{item.username}</Text>
            </View>

            <TouchableOpacity
                style={[styles.followButton, item.is_following && styles.followingButton]}
                onPress={() => toggleFollow(item)}
            >
                {item.is_following ? (
                    <Text style={styles.followingText}>Following</Text>
                ) : (
                    <>
                        <UserPlus size={16} color="white" />
                        <Text style={styles.followText}>Follow</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Search size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search users..."
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                        autoFocus
                    />
                </View>
            </View>

            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    query ? (
                        <View style={styles.emptyContainer}>
                            <Users size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No users found</Text>
                            <Text style={styles.emptySubtext}>Try a different search term</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Search size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>Find Friends</Text>
                            <Text style={styles.emptySubtext}>Search for users to follow</Text>
                        </View>
                    )
                }
            />
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
        alignItems: 'center',
        padding: 16,
        gap: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        padding: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
    list: {
        padding: 16,
        flexGrow: 1,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E2E8F0',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    username: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    followingButton: {
        backgroundColor: '#E2E8F0',
    },
    followText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    followingText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
});

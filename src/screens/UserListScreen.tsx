import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Users } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../constants/theme';

type RouteParams = {
    UserList: { type: 'following' | 'followers', userId: string };
};

interface ListUser {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
}

// Mock data for local functionality
const MOCK_FOLLOWING: ListUser[] = [
    { id: '1', username: '@habit_master', full_name: 'Sarah Chen', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: '2', username: '@goal_getter', full_name: 'James Brown', avatar_url: 'https://randomuser.me/api/portraits/men/56.jpg' },
];

const MOCK_FOLLOWERS: ListUser[] = [
    { id: '3', username: '@daily_achiever', full_name: 'Mike Williams', avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg' },
    { id: '4', username: '@wellness_warrior', full_name: 'Emma Davis', avatar_url: 'https://randomuser.me/api/portraits/women/28.jpg' },
    { id: '5', username: '@productivity_pro', full_name: 'Alex Johnson', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg' },
];

export default function UserListScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'UserList'>>();
    const { type } = route.params;

    // Use mock data based on type
    const users = type === 'following' ? MOCK_FOLLOWING : MOCK_FOLLOWERS;

    const renderItem = ({ item }: { item: ListUser }) => (
        <View style={styles.userRow}>
            <Image
                source={{ uri: item.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.name}>{item.full_name || 'Unknown'}</Text>
                <Text style={styles.username}>{item.username}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{type === 'following' ? 'Following' : 'Followers'}</Text>
            </View>

            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Users size={48} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>
                            {type === 'following' ? 'Not following anyone yet' : 'No followers yet'}
                        </Text>
                    </View>
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
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        textTransform: 'capitalize'
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 16,
        fontSize: 16,
    }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useHabitStore } from '../store/useHabitStore';

type RouteParams = {
    UserList: { type: 'following' | 'followers', userId: string };
};

interface ListUser {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
}

export default function UserListScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'UserList'>>();
    const { type, userId } = route.params;
    const { followUser, unfollowUser, session } = useHabitStore();

    const [users, setUsers] = useState<ListUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [type, userId]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let data;

            if (type === 'following') {
                // Get people I am following
                const { data: follows, error } = await supabase
                    .from('social_follows')
                    .select('following_id, profiles:following_id(*)') // join profiles
                    .eq('flower_id', userId);

                if (error) throw error;
                // Supabase returns nested object, map it
                data = follows?.map((f: any) => f.profiles) || [];
            } else {
                // Get people following me
                const { data: followers, error } = await supabase
                    .from('social_follows')
                    .select('flower_id, profiles:flower_id(*)')
                    .eq('following_id', userId);

                if (error) throw error;
                data = followers?.map((f: any) => f.profiles) || [];
            }

            setUsers(data as ListUser[]);
        } catch (error) {
            console.error("Fetch list error:", error);
        } finally {
            setLoading(false);
        }
    };

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

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No users found.</Text>
                    }
                />
            )}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 40,
    }
});

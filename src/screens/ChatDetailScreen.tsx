import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore, Message } from '../store/useHabitStore';
import { format } from 'date-fns';

type ChatDetailRouteProp = RouteProp<{ ChatDetail: { chatId: string } }, 'ChatDetail'>;

export default function ChatDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<ChatDetailRouteProp>();
    const { chatId } = route.params;
    const { chats, sendMessage, fetchMessages, markChatRead } = useHabitStore();
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const chat = chats.find(c => c.id === chatId);

    useEffect(() => {
        if (chatId) {
            fetchMessages(chatId);
            markChatRead(chatId);
        }
    }, [chatId]);

    const handleSend = () => {
        if (!inputText.trim() || !chatId) return;

        const text = inputText.trim();
        sendMessage(chatId, text);
        setInputText('');
    };

    if (!chat) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chat Not Found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === 'me';
        return (
            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
                {!isMe && <Image source={{ uri: chat.avatar }} style={styles.messageAvatar} />}
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isMe && { color: 'white' }]}>{item.text}</Text>
                    <Text style={[styles.timeText, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                        {format(new Date(item.timestamp), 'h:mm a')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Image source={{ uri: chat.avatar }} style={styles.headerAvatar} />
                <View>
                    <Text style={styles.headerTitle}>{chat.name}</Text>
                    <Text style={styles.status}>Online</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 30}
                style={{ flex: 1 }}
            >
                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={chat.messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    inverted
                    showsVerticalScrollIndicator={false}
                />

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.disabledSend]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: 'white',
    },
    backButton: {
        marginRight: 16,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    status: {
        fontSize: 12,
        color: theme.colors.success,
        marginTop: 2,
    },
    list: {
        padding: 16,
        paddingBottom: 24,
    },
    messageRow: {
        marginVertical: 4,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    bubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#E2E8F0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        color: theme.colors.text,
        lineHeight: 20,
    },
    timeText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledSend: {
        backgroundColor: '#CBD5E1',
    },
    keyboardAvoidingView: {
        width: '100%',
    },
});

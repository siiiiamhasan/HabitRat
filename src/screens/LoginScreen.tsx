import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useHabitStore } from '../store/useHabitStore';
import { theme } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const navigation = useNavigation();
    const login = useHabitStore(state => state.login);
    const loginAnonymously = useHabitStore(state => state.loginAnonymously);

    const handleGoogleLogin = async () => {
        await login();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image source={require('../../assets/icon.png')} style={styles.logo} />
                    <Text style={styles.appName}>HabitRat</Text>
                    <Text style={styles.tagline}>Build better habits, together.</Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                        <Image
                            source={require('../../assets/google-logo.png')}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.guestButton} onPress={() => loginAnonymously()}>
                        <Text style={styles.guestButtonText}>Continue as Guest</Text>
                    </TouchableOpacity>

                    <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>By continuing, you agree to our </Text>
                        <View style={styles.linkRow}>
                            <TouchableOpacity onPress={() => (navigation as any).navigate('Terms')}>
                                <Text style={styles.linkText}>Terms of Service</Text>
                            </TouchableOpacity>
                            <Text style={styles.termsText}> & </Text>
                            <TouchableOpacity onPress={() => (navigation as any).navigate('Privacy')}>
                                <Text style={styles.linkText}>Privacy Policy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 60,
    },
    header: {
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 20,
        marginBottom: 20,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.text,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustration: {
        width: width * 0.8,
        height: width * 0.8,
        opacity: 0.8,
    },
    footer: {
        width: '100%',
        gap: 20,
        marginBottom: 40,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    googleIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    guestButton: {
        marginTop: 4,
        padding: 12,
        alignItems: 'center',
    },
    guestButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    terms: {
        width: '100%',
        alignItems: 'center',
    },
    termsContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    termsText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    linkText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    }
});

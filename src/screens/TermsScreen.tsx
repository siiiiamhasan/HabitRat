import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../constants/theme';

export default function TermsScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.text}>
                    By accessing and using HabitRat, you accept and agree to be bound by the terms and provision of this agreement.
                </Text>

                <Text style={styles.sectionTitle}>2. Use License</Text>
                <Text style={styles.text}>
                    Permission is granted to temporarily download one copy of the materials (information or software) on HabitRat's application for personal, non-commercial transitory viewing only.
                </Text>

                <Text style={styles.sectionTitle}>3. User Accounts</Text>
                <Text style={styles.text}>
                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </Text>

                <Text style={styles.sectionTitle}>4. Disclaimer</Text>
                <Text style={styles.text}>
                    The materials on HabitRat are provided "as is". HabitRat makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
                </Text>

                <Text style={styles.sectionTitle}>5. Limitations</Text>
                <Text style={styles.text}>
                    In no event shall HabitRat or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on HabitRat.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
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
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 20,
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
});

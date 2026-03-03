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

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last Updated: Feb 10, 2026</Text>

                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.text}>
                    Welcome to HabitRat! By downloading or using the app, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app.
                </Text>

                <Text style={styles.sectionTitle}>2. Use of the App</Text>
                <Text style={styles.text}>
                    HabitRat is designed to help you track habits and improve your productivity. You are not allowed to copy, or modify the app, any part of the app, or our trademarks in any way. You are not allowed to attempt to extract the source code of the app, and you also shouldn't try to translate the app into other languages, or make derivative versions.
                </Text>

                <Text style={styles.sectionTitle}>3. User Accounts & Data</Text>
                <Text style={styles.text}>
                    You are responsible for keeping your device and access to the app secure. We recommend that you do not jailbreak or root your phone, which is the process of removing software restrictions and limitations imposed by the official operating system of your device. It could make your phone vulnerable to malware/viruses/malicious programs, compromise your phone's security features and it could mean that the HabitRat app won't work properly or at all.
                </Text>

                <Text style={styles.sectionTitle}>4. Premium Subscriptions</Text>
                <Text style={styles.text}>
                    HabitRat offers a Premium subscription that unlocks additional features such as unlimited habit tracking, advanced analytics, and data backup.
                    {'\n\n'}
                    • Payments will be charged to your iTunes/Play Store Account at confirmation of purchase.
                    {'\n'}
                    • Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.
                    {'\n'}
                    • You can manage your subscriptions and turn off auto-renewal by going to your Account Settings after purchase.
                </Text>

                <Text style={styles.sectionTitle}>5. Virtual Currency (Coins)</Text>
                <Text style={styles.text}>
                    HabitRat may include virtual currency ("Coins") or items that can be earned or purchased. These items have no real-world monetary value and cannot be exchanged for real money.
                </Text>

                <Text style={styles.sectionTitle}>6. Third Party Services</Text>
                <Text style={styles.text}>
                    The app does use third party services that declare their own Terms and Conditions.
                    {'\n'}
                    • Google Play Services
                    {'\n'}
                    • AdMob
                    {'\n'}
                    • Expo
                </Text>

                <Text style={styles.sectionTitle}>7. Changes to This Terms and Conditions</Text>
                <Text style={styles.text}>
                    We may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Terms and Conditions on this page.
                </Text>

                <Text style={styles.sectionTitle}>8. Contact Us</Text>
                <Text style={styles.text}>
                    If you have any questions or suggestions about our Terms and Conditions, do not hesitate to contact us at support@habitrat.app.
                </Text>

                <View style={{ height: 40 }} />
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
    lastUpdated: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 20,
    },
});

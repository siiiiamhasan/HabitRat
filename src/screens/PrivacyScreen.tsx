import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../constants/theme';

export default function PrivacyScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.lastUpdated}>Last Updated: Feb 10, 2026</Text>

                <Text style={styles.sectionTitle}>1. Information Collection</Text>
                <Text style={styles.text}>
                    HabitRat prioritizes your privacy. Most of your habit data is stored locally on your device or in your personal cloud storage if you enable backups. We may collect:
                    {'\n'}
                    • Device Information (Model, OS version) for analytics and debugging.
                    {'\n'}
                    • Usage Data (Features used, session duration) to improve the app.
                    {'\n'}
                    • Account Information (Name, Email) if you choose to sign in.
                </Text>

                <Text style={styles.sectionTitle}>2. Use of Information</Text>
                <Text style={styles.text}>
                    The information we collect is used to:
                    {'\n'}
                    • Provide and maintain our Service.
                    {'\n'}
                    • Notify you about changes to our Service.
                    {'\n'}
                    • Allow you to participate in interactive features when you choose to do so.
                    {'\n'}
                    • Provide customer support.
                    {'\n'}
                    • Monitor the usage of our Service.
                </Text>

                <Text style={styles.sectionTitle}>3. Data Storage</Text>
                <Text style={styles.text}>
                    HabitRat uses local storage on your device. If you delete the app without a backup, your data may be lost. Premium users may have access to cloud backup features which store data securely on our servers.
                </Text>

                <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
                <Text style={styles.text}>
                    We may employ third-party companies and individuals due to the following reasons:
                    {'\n'}
                    • To facilitate our Service;
                    {'\n'}
                    • To provide the Service on our behalf;
                    {'\n'}
                    • To perform Service-related services; or
                    {'\n'}
                    • To assist us in analyzing how our Service is used.
                </Text>

                <Text style={styles.sectionTitle}>5. Security</Text>
                <Text style={styles.text}>
                    We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                </Text>

                <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
                <Text style={styles.text}>
                    These Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
                </Text>

                <Text style={styles.sectionTitle}>7. Contact Us</Text>
                <Text style={styles.text}>
                    If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at privacy@habitrat.app.
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

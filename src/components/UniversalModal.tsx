import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Platform, Keyboard, Dimensions, Pressable } from 'react-native';
import { theme } from '../constants/theme';

interface UniversalModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    animationType?: 'none' | 'slide' | 'fade';
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'overFullScreen' | 'formSheet';
    transparent?: boolean;
}

export default function UniversalModal({
    visible,
    onClose,
    children,
    animationType = 'fade',
    presentationStyle = 'overFullScreen',
    transparent = true
}: UniversalModalProps) {

    // Web ESC key support
    useEffect(() => {
        if (Platform.OS === 'web' && visible) {
            const handleKeyDown = (e: any) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            // @ts-ignore - 'window' exists on web
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                // @ts-ignore
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [visible, onClose]);

    return (
        <Modal
            visible={visible}
            transparent={transparent}
            animationType={animationType}
            presentationStyle={presentationStyle === 'overFullScreen' && Platform.OS === 'ios' ? 'overFullScreen' : undefined}
            onRequestClose={onClose} // Android Back Button
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.contentContainer} pointerEvents="box-none">
                    {children}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        pointerEvents: 'box-none',
    }
});

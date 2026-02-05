import { Platform } from 'react-native';

export const theme = {
    colors: {
        background: '#FDFBF7', // Soft beige/white
        surface: '#FFFFFF',
        text: '#24292F',
        textSecondary: '#57606A',
        border: '#D0D7DE',
        primary: '#2da44e', // GitHub green
        heatmap: {
            0: '#ebedf0',
            1: '#9be9a8',
            2: '#40c463',
            3: '#30a14e',
            4: '#216e39',
        },
        success: '#2da44e',
        danger: '#cf222e',
        secondary: '#e1e4e8',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
    },
    borderRadius: {
        s: 4,
        m: 8,
        l: 12,
        full: 999,
    },
    typography: {
        header: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#37352F', // Notion title color
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        subHeader: {
            fontSize: 18,
            fontWeight: '600',
            color: '#37352F',
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        body: {
            fontSize: 14,
            color: '#37352F',
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        },
        caption: {
            fontSize: 12,
            color: '#787774', // Notion gray
            fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        }
    }
} as const;

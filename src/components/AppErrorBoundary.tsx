import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ error, errorInfo });
    // In a production app, you might log the error to an error reporting service
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    // Reload the app (works for Expo/React Native)
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      // For React Native/Expo, we can't reload the app programmatically
      // Instead, we'll reset the error state to allow the app to continue
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  handleReset = () => {
    // Reset the error boundary state to allow the app to continue
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message || 'An unexpected error occurred.'}</Text>
          {this.state.errorInfo?.componentStack ? (
            <Text style={styles.stack}>{this.state.errorInfo.componentStack}</Text>
          ) : null}
          <View style={styles.buttonContainer}>
            <Button title="Try Again" onPress={this.handleReset} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#c00',
  },
  message: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  stack: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
    minWidth: 120,
  },
});

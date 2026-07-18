/**
 * ErrorBoundary — surfaces render errors instead of a blank screen.
 * Wraps the app so a single faulty panel can't take the whole room down.
 */
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Aura] render error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'monospace',
            color: '#FF4D5E',
            background: '#0A0E13',
            minHeight: '100vh',
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ fontSize: 16 }}>Fallo de render</strong>
          {'\n\n'}
          {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          {'\n\n'}
          {this.state.info?.componentStack}
        </div>
      );
    }
    return this.props.children;
  }
}

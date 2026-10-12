import { Component, type ReactNode } from 'react'

type Props = { fallback: ReactNode; onError?: (e: unknown) => void; children: ReactNode }

/** Catches render/load failures (e.g. a 3D chunk that fails to download) and shows a fallback instead. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    this.props.onError?.(error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

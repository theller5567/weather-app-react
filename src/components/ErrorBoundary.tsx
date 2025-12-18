import { Component } from 'react'
import type { ReactNode } from 'react'
import iconError from '../assets/images/icon-error.svg'
import iconRetry from '../assets/images/icon-retry.svg'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  // componentDidCatch(error: Error, info: unknown) {
  //   // TODO: hook up to a reporting service (Sentry, etc.)
  //   // console.error('Unhandled render error', error, info)
  // }

  handleRetry = () => {
    // Reset the boundary and re-render children
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen" role="alert" aria-live="assertive">
          <img src={iconError} alt="" aria-hidden="true" />
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred in the app. Please try again.</p>
          <button className="btn-retry" onClick={this.handleRetry}>
            <img src={iconRetry} alt="" aria-hidden="true" />
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}



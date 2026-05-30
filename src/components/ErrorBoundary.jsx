import { Component } from 'react'

// حاجزی هەڵە — لەبری شاشەی بەتاڵ، پەیامی هەڵە پیشان دەدات
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-lg font-black text-impostor">هەڵەیەک ڕوویدا</p>
          <p className="max-h-40 overflow-auto rounded-xl bg-ink/5 p-3 text-xs text-ink/70" dir="ltr">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button
            onClick={() => this.setState({ error: null }) || this.props.onReset?.()}
            className="btn-press rounded-2xl bg-crew px-6 py-3 font-bold text-white"
          >
            گەڕانەوە
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

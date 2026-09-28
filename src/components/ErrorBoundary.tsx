import { Component, type ReactNode } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Ловит непойманные ошибки рендера, чтобы показать понятный экран вместо белой страницы.
// Не перехватывает ошибки в асинхронных обработчиках (fetch и т.п.) — там уже есть try/catch.
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <Icon name="AlertTriangle" size={24} />
            </div>
            <h1 className="font-serif text-xl font-bold mb-2">Что-то пошло не так</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Icon name="RefreshCw" size={15} /> Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

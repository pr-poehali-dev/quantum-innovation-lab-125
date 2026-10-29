// Заглушка для страниц кабинета и админки, которые рендерятся только в браузере
// (сессия хранится в localStorage): сервер отдаёт тот же спиннер, что и StaffGuard.
const RoutePending = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="sr-only">Загрузка страницы, подождите…</span>
  </div>
);

export default RoutePending;

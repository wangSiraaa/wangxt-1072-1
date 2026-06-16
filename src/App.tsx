import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ShowcasesPage from './pages/ShowcasesPage';
import InspectionsPage from './pages/InspectionsPage';
import AlarmsPage from './pages/AlarmsPage';
import RepairsPage from './pages/RepairsPage';
import NewArrivalsPage from './pages/NewArrivalsPage';

function AppContent() {
  const { state } = useApp();

  const renderPage = () => {
    switch (state.currentView) {
      case 'showcases':
        return <ShowcasesPage />;
      case 'inspections':
        return <InspectionsPage />;
      case 'alarms':
        return <AlarmsPage />;
      case 'repairs':
        return <RepairsPage />;
      case 'newarrivals':
        return <NewArrivalsPage />;
      default:
        return <ShowcasesPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

import DesktopNav from "./DesktopNav";
import MobileNav  from "./MobileNav";
import MarketStatusBar from "./MarketStatusBar";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      {/* Desktop left nav — fixed width sidebar */}
      <DesktopNav />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top status bar */}
        <MarketStatusBar />

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}

import { OperationsDashboard } from "./operations-dashboard";
import { TopBar } from "./top-bar";
import { LangProvider } from "./i18n";
import { loadDashboardData } from "../lib/load-dashboard-data";

export default async function HomePage() {
  const data = await loadDashboardData();
  return (
    <LangProvider>
      <TopBar />
      <OperationsDashboard initialData={data} />
    </LangProvider>
  );
}

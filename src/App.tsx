import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { DataProvider } from "./context/DataContext";
import { Layout } from "./components/layout/Layout";

import Home from "./pages/Home";
import NoDeposit from "./pages/NoDeposit";
import Deposit from "./pages/Deposit";
import Contests from "./pages/Contests";
import About from "./pages/About";
import BrokerDetail from "./pages/BrokerDetail";
import Admin from "./pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/no-deposit" component={NoDeposit} />
        <Route path="/deposit" component={Deposit} />
        <Route path="/contests" component={Contests} />
        <Route path="/about" component={About} />
        <Route path="/broker/:id" component={BrokerDetail} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}

export default App;

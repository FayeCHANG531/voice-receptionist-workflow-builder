import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import WorkflowCanvas from './components/pages/WorkflowCanvas';
import SimulationTest from './components/pages/SimulationTest';
import VersionManagement from './components/pages/VersionManagement';
import RuntimeManagement from './components/pages/RuntimeManagement';
import OperationsDashboard from './components/pages/OperationsDashboard';
import TelephonySettings from './components/pages/TelephonySettings';
import NumberManagement from './components/pages/NumberManagement';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: WorkflowCanvas },
      { path: 'simulation', Component: SimulationTest },
      { path: 'versions', Component: VersionManagement },
      { path: 'runtime', Component: RuntimeManagement },
      { path: 'dashboard', Component: OperationsDashboard },
      { path: 'telephony', Component: TelephonySettings },
      { path: 'numbers', Component: NumberManagement },
    ],
  },
]);

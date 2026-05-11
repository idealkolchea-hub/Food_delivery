import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { ToastProvider } from './hooks/useToast';
import { CartProvider } from './hooks/useCart';
import { OrderFlowProvider } from './hooks/useOrderFlow';
import { CustomerSessionProvider } from './hooks/useCustomerSession';
import { RestaurantSessionProvider } from './hooks/useRestaurantSession';
import { AgentSessionProvider } from './hooks/useAgentSession';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CustomerSessionProvider>
          <RestaurantSessionProvider>
            <AgentSessionProvider>
              <OrderFlowProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </OrderFlowProvider>
            </AgentSessionProvider>
          </RestaurantSessionProvider>
        </CustomerSessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

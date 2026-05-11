import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function CustomerRouteLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

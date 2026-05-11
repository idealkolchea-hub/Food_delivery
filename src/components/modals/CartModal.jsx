import { Link } from 'react-router-dom';
import { DrilldownModal } from './DrilldownModal';
import { Button } from '../ui/Button';

export function CartModal({ open, onClose }) {
  return (
    <DrilldownModal open={open} onClose={onClose} title="Cart updated" subtitle="Quick jump">
      <div className="space-y-4">
        <p className="text-[color:var(--text-secondary)]">
          Your selections are glowing in the cart. Jump straight to summary or keep browsing.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/customer/cart"><Button>Open Cart</Button></Link>
          <Button variant="secondary" onClick={onClose}>Keep Exploring</Button>
        </div>
      </div>
    </DrilldownModal>
  );
}
